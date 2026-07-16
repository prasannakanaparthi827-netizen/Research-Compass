const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, {
    expiresIn: "30d",
  });
}

function getUserFromEvent(event) {
  const auth = event.headers.authorization || event.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = { signToken, getUserFromEvent };
