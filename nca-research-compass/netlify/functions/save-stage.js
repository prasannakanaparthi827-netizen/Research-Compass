const { getDatabase } = require("@netlify/database");
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
