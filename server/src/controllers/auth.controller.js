import { DEMO_USERS } from "../data/demo.data.js";

export function login(req, res) {
  const { email } = req.body || {};
  const user = DEMO_USERS.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid demo login email" });
  }

  // Milestone 2 token: placeholder
  const token = `demo-token-${user.user_id}`;
  return res.json({ ok: true, user, token });
}

export function logout(req, res) {
  return res.json({ ok: true });
}