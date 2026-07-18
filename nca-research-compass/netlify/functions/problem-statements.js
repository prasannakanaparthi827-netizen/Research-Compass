const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { data, error } = await supabase
      .from("problem_statements")
      .select("id, category, title, statement")
      .order("category", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify({ statements: data }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Could not load problem statements." }) };
  }
};const { getDatabase } = require("@netlify/database");

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
