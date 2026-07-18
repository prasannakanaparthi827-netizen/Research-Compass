const { createClient } = require("@supabase/supabase-js");
const { getUserFromEvent } = require("./_auth");
const { STAGES, PROMPTS } = require("./_stages");

const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "AI generation isn't configured yet. Add an ANTHROPIC_API_KEY environment variable in the Netlify site settings.",
      }),
    };
  }

  try {
    const { project_id, stage_number } = JSON.parse(event.body || "{}");
    const stage = STAGES.find((s) => s.number === stage_number);
    if (!stage || !PROMPTS[stage.key]) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid stage." }) };
    }

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return { statusCode: 404, body: JSON.stringify({ error: "Project not found." }) };
    }

    const prompt = PROMPTS[stage.key](project.problem_statement);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "The AI mentor is unavailable right now. Please try again." }) };
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    const { error: upsertError } = await supabase
      .from("project_stages")
      .upsert(
        {
          project_id,
          stage_number: stage.number,
          stage_key: stage.key,
          content: text,
          generated: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,stage_number" }
      );

    if (upsertError) throw upsertError;

    const newCurrentStage = Math.max(project.current_stage, Math.min(stage.number + 1, STAGES.length));

    const { error: updateError } = await supabase
      .from("projects")
      .update({ current_stage: newCurrentStage, updated_at: new Date().toISOString() })
      .eq("id", project_id);

    if (updateError) throw updateError;

    return { statusCode: 200, body: JSON.stringify({ content: text }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Something went wrong generating this section." }) };
  }
};const { getDatabase } = require("@netlify/database");
const { getUserFromEvent } = require("./_auth");
const { STAGES, PROMPTS } = require("./_stages");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "AI generation isn't configured yet. Add an ANTHROPIC_API_KEY environment variable in the Netlify site settings.",
      }),
    };
  }

  try {
    const { project_id, stage_number } = JSON.parse(event.body || "{}");
    const stage = STAGES.find((s) => s.number === stage_number);
    if (!stage || !PROMPTS[stage.key]) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid stage." }) };
    }

    const db = getDatabase();
    const projRows = await db.sql`SELECT * FROM projects WHERE id = ${project_id} AND user_id = ${user.id}`;
    if (projRows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Project not found." }) };
    }
    const project = projRows[0];

    const prompt = PROMPTS[stage.key](project.problem_statement);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "The AI mentor is unavailable right now. Please try again." }) };
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();

    await db.sql`
      INSERT INTO project_stages (project_id, stage_number, stage_key, content, generated)
      VALUES (${project_id}, ${stage.number}, ${stage.key}, ${text}, TRUE)
      ON CONFLICT (project_id, stage_number)
      DO UPDATE SET content = ${text}, generated = TRUE, updated_at = NOW()
    `;

    const newCurrentStage = Math.max(project.current_stage, Math.min(stage.number + 1, STAGES.length));
    await db.sql`UPDATE projects SET current_stage = ${newCurrentStage}, updated_at = NOW() WHERE id = ${project_id}`;

    return { statusCode: 200, body: JSON.stringify({ content: text }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Something went wrong generating this section." }) };
  }
};
