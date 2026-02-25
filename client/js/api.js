const API_BASE = "http://localhost:3001/api";
const SESSION_KEY = "openslot_session";

async function request(method, path, body) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));

    if (typeof payload.ok !== "boolean") {
      payload.ok = response.ok;
    }

    if (!response.ok && payload.ok !== false) {
      payload.ok = false;
    }

    if (!payload.ok && !payload.message) {
      payload.message = `Request failed (${response.status})`;
    }

    return payload;
  } catch {
    return {
      ok: false,
      message: "Unable to reach API. Ensure server is running at http://localhost:3001"
    };
  }
}

export function apiGet(path) {
  return request("GET", path);
}

export function apiPost(path, body) {
  return request("POST", path, body);
}

export function apiPatch(path, body) {
  return request("PATCH", path, body);
}

export function fmtDT(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function setMessage(node, message, tone = "info") {
  if (!node) return;
  node.textContent = message || "";

  if (node.id === "notice") {
    const classes = ["notice"];
    if (tone === "error") classes.push("error");
    if (tone === "success") classes.push("success");
    node.className = classes.join(" ");
    return;
  }

  node.className = `message message-${tone}`;
}
