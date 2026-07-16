const { getDatabase } = require("@netlify/database");
const { getUserFromEvent } = require("./_auth");
const { STAGES } = require("./_stages");

exports.handler = async (event) => {
  const user = getUserFromEvent(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Please log in." }) };
  }

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Project id is required." }) };
  }

  const db = getDatabase();

  const rows = await db.sql`SELECT * FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
  if (rows.length === 0) {
    return { statusCode: 404, body: JSON.stringify({ error: "Project not found." }) };
  }
  const project = rows[0];

  if (event.httpMethod === "GET") {
    const stageRows = await db.sql`SELECT * FROM project_stages WHERE project_id = ${id} ORDER BY stage_number`;
    const stageMap = {};
    stageRows.forEach((s) => (stageMap[s.stage_number] = s));

    const stages = STAGES.map((s) => ({
      ...s,
      content: stageMap[s.number] ? stageMap[s.number].content : null,
      generated: stageMap[s.number] ? stageMap[s.number].generated : false,
    }));

    return { statusCode: 200, body: JSON.stringify({ project, stages }) };
  }

  if (event.httpMethod === "DELETE") {
    await db.sql`DELETE FROM projects WHERE id = ${id} AND user_id = ${user.id}`;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
