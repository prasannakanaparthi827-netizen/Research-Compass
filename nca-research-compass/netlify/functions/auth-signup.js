const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { signToken } = require("./_auth");

const supabase = createClient(
  process.env.SUPABASE_DATABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    const normalizedEmail = email.toLowerCase();

    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "An account with this email already exists." }),
      };
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert({
        name,
        email: normalizedEmail,
        password_hash: hash,
        college: college || null,
      })
      .select("id, name, email")
      .single();

    if (insertError) throw insertError;

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
