const { createClient } = require("@supabase/supabase-js");
const { getUserFromEvent } = require("./_auth");
const { STAGES } = require("./_stages");

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

  try {
    const { project_id, stage_number, content } = JSON.parse(event.body || "{}");
    const stage = STAGES.find((s) => s.number === stage_number);
    if (!stage) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid stage." }) };
    }

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return { statusCode: 404, body: JSON.stringify({ error: "Project not found." }) };
    }

    const { error: upsertError } = await supabase
      .from("project_stages")
      .upsert(
        {
          project_id,
          stage_number: stage.number,
          stage_key: stage.key,
          content,
          generated: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,stage_number" }
      );

    if (upsertError) throw upsertError;

    if (stage_number === STAGES.length) {
      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", project_id);

      if (updateError) throw updateError;
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not save your changes." }) };
  }
};const { getDatabase } = require("@netlify/database");
const { getUserFromEvent } = require("./_auth");
const { STAGES } = require("./_stages");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  try {
    const { project_id, stage_number, content } = JSON.parse(event.body || "{}");
    const stage = STAGES.find((s) => s.number === stage_number);
    if (!stage) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid stage." }) };
    }

    const db = getDatabase();
    const projRows = await db.sql`SELECT id FROM projects WHERE id = ${project_id} AND user_id = ${user.id}`;
    if (projRows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Project not found." }) };
    }

    await db.sql`
      INSERT INTO project_stages (project_id, stage_number, stage_key, content, generated)
      VALUES (${project_id}, ${stage.number}, ${stage.key}, ${content}, TRUE)
      ON CONFLICT (project_id, stage_number)
      DO UPDATE SET content = ${content}, updated_at = NOW()
    `;

    if (stage_number === STAGES.length) {
      await db.sql`UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = ${project_id}`;
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not save your changes." }) };
  }
};
