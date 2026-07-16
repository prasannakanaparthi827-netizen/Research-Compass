const bcrypt = require("bcryptjs");
const { getDatabase } = require("@netlify/database");
const { signToken } = require("./_auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, email, password, college } = JSON.parse(event.body || "{}");

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name, email, and password are required." }),
      };
    }
    if (password.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Password must be at least 6 characters." }),
      };
    }

    const db = getDatabase();
    const existing = await db.sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "An account with this email already exists." }),
      };
    }

    const hash = await bcrypt.hash(password, 10);
    const [user] = await db.sql`
      INSERT INTO users (name, email, password_hash, college)
      VALUES (${name}, ${email.toLowerCase()}, ${hash}, ${college || null})
      RETURNING id, name, email
    `;

    const token = signToken(user);
    return {
      statusCode: 200,
      body: JSON.stringify({ token, user }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Something went wrong. Please try again." }) };
  }
};
