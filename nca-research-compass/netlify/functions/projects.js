const { getDatabase } = require("@netlify/database");
const { getUserFromEvent } = require("./_auth");
const { STAGES } = require("./_stages");

exports.handler = async (event) => {
  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  const db = getDatabase();

  if (event.httpMethod === "GET") {
    const rows = await db.sql`
      SELECT id, title, problem_statement, source, current_stage, status, updated_at
      FROM projects WHERE user_id = ${user.id} ORDER BY updated_at DESC
    `;
    return { statusCode: 200, body: JSON.stringify({ projects: rows }) };
  }

  if (event.httpMethod === "POST") {
    try {
      const { title, problem_statement, source } = JSON.parse(event.body || "{}");
      if (!problem_statement || !problem_statement.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: "A problem statement is required." }) };
      }
      const projectTitle = title && title.trim() ? title.trim() : problem_statement.slice(0, 60);

      const [project] = await db.sql`
        INSERT INTO projects (user_id, title, problem_statement, source)
        VALUES (${user.id}, ${projectTitle}, ${problem_statement.trim()}, ${source || "custom"})
        RETURNING id, title, problem_statement, source, current_stage, status, updated_at
      `;

      // Seed stage 1 with the problem statement itself, already "generated"
      const stage1 = STAGES[0];
      await db.sql`
        INSERT INTO project_stages (project_id, stage_number, stage_key, content, generated)
        VALUES (${project.id}, ${stage1.number}, ${stage1.key}, ${problem_statement.trim()}, TRUE)
      `;

      return { statusCode: 200, body: JSON.stringify({ project }) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: JSON.stringify({ error: "Could not create project." }) };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
