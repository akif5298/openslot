import { DEMO_USERS } from "../data/demo.data.js";

function sanitizeUser(user) {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export function login(req, res) {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({ ok: false, message: "Email is required" });
  }

  const user = DEMO_USERS.find(candidate => candidate.email.toLowerCase() === email);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid email for demo login" });
  }

  return res.json({
    ok: true,
    token: `demo-token-${user.user_id}`,
    user: sanitizeUser(user)
  });
}

export function logout(req, res) {
  // Demo environment uses client-side session storage only.
  return res.json({ ok: true, message: "Logged out" });
}
