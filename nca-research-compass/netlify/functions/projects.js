const { createClient } = require("@supabase/supabase-js");
const { getUserFromEvent } = require("./_auth");
const { STAGES } = require("./_stages");

const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, problem_statement, source, current_stage, status, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not load projects." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ projects: data }) };
  }

  if (event.httpMethod === "POST") {
    try {
      const { title, problem_statement, source } = JSON.parse(event.body || "{}");
      if (!problem_statement || !problem_statement.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: "A problem statement is required." }) };
      }
      const projectTitle = title && title.trim() ? title.trim() : problem_statement.slice(0, 60);

      const { data: project, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          title: projectTitle,
          problem_statement: problem_statement.trim(),
          source: source || "custom",
        })
        .select("id, title, problem_statement, source, current_stage, status, updated_at")
        .single();

      if (insertError) throw insertError;

      // Seed stage 1 with the problem statement itself, already "generated"
      const stage1 = STAGES[0];
      const { error: stageError } = await supabase.from("project_stages").insert({
        project_id: project.id,
        stage_number: stage1.number,
        stage_key: stage1.key,
        content: problem_statement.trim(),
        generated: true,
      });

      if (stageError) throw stageError;

      return { statusCode: 200, body: JSON.stringify({ project }) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not create project." }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
