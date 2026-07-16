const { getDatabase } = require("@netlify/database");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const db = getDatabase();
    const rows = await db.sql`SELECT id, category, title, statement FROM problem_statements ORDER BY category, id`;
    return { statusCode: 200, body: JSON.stringify({ statements: rows }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load problem statements." }) };
  }
};
