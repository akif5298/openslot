import { getUserByEmail, getUserById, updateUserProfile } from "../db/repository.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function login(req, res) {
  const email = normalizedEmail(req.body?.email);
  if (!email || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ ok: false, message: "Enter a valid email address." });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid demo login email" });
  }

  const token = `demo-token-${user.user_id}`;
  return res.json({ ok: true, user, token });
}

export function logout(req, res) {
  return res.json({ ok: true });
}

export function updateProfile(req, res) {
  const userId = parsePositiveInt(req.params.userId);
  if (!userId) {
    return res.status(400).json({ ok: false, message: "Invalid user id" });
  }

  if (req.user.user_id !== userId) {
    return res.status(403).json({ ok: false, message: "You can only update your own profile." });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ ok: false, message: "User not found" });
  }

  const updates = req.body || {};
  const nextName = String(updates.name ?? user.name).trim();
  const nextEmail = normalizedEmail(updates.email ?? user.email);
  const nextOffice = String(updates.office_location ?? user.office_location ?? "").trim();
  const nextBio = String(updates.bio ?? user.bio ?? "").trim();

  if (!nextName) {
    return res.status(400).json({ ok: false, message: "Name is required" });
  }

  if (!nextEmail || !EMAIL_PATTERN.test(nextEmail)) {
    return res.status(400).json({ ok: false, message: "A valid email is required" });
  }

  const emailOwner = getUserByEmail(nextEmail);
  if (emailOwner && emailOwner.user_id !== userId) {
    return res.status(409).json({ ok: false, message: "Email is already in use" });
  }

  const nextUser = updateUserProfile(userId, {
    name: nextName,
    email: nextEmail,
    office_location: nextOffice,
    bio: nextBio
  });

  return res.json({ ok: true, user: nextUser });
}
