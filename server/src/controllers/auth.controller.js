import { DEMO_USERS } from "../data/demo.data.js";

export function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const user = DEMO_USERS.find(u => String(u.email).toLowerCase() === email);

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

export function updateProfile(req, res) {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ ok: false, message: "Invalid user id" });
  }

  const user = DEMO_USERS.find(item => item.user_id === userId);
  if (!user) {
    return res.status(404).json({ ok: false, message: "User not found" });
  }

  const updates = req.body || {};
  const nextName = String(updates.name ?? user.name).trim();
  const nextEmail = String(updates.email ?? user.email).trim().toLowerCase();
  const nextOffice = String(updates.office_location ?? user.office_location ?? "").trim();
  const nextBio = String(updates.bio ?? user.bio ?? "").trim();

  if (!nextName) {
    return res.status(400).json({ ok: false, message: "Name is required" });
  }

  if (!nextEmail) {
    return res.status(400).json({ ok: false, message: "Email is required" });
  }

  const emailTaken = DEMO_USERS.some(
    item => item.user_id !== userId && String(item.email).trim().toLowerCase() === nextEmail
  );
  if (emailTaken) {
    return res.status(409).json({ ok: false, message: "Email is already in use" });
  }

  user.name = nextName;
  user.email = nextEmail;
  user.office_location = nextOffice;
  user.bio = nextBio;

  return res.json({ ok: true, user });
}
