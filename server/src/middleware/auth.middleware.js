import { getUserById } from "../db/repository.js";

function tokenUserId(token) {
  if (!token || !token.startsWith("demo-token-")) return null;
  const value = Number(token.slice("demo-token-".length));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.trunc(value);
}

export function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const userId = tokenUserId(token);

  if (!userId) {
    return res.status(401).json({ ok: false, message: "Authentication required." });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid session token." });
  }

  req.user = user;
  return next();
}

export function requireRole(role) {
  return function enforceRole(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: "Authentication required." });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ ok: false, message: `${role} access required.` });
    }

    return next();
  };
}
