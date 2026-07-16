const bcrypt = require("bcryptjs");
const { getDatabase } = require("@netlify/database");
const { signToken } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and password are required." }) };
    }

    const db = getDatabase();
    const rows = await db.sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    if (rows.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid email or password." }) };
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid email or password." }) };
    }

    const token = signToken(user);
    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Something went wrong. Please try again." }) };
  }
};
