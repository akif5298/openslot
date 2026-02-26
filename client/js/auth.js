import { apiPost, clearSession, getSession, setMessage, setSession } from "./api.js";

function roleHome(role) {
  return role === "professor" ? "professor-dashboard.html" : "student-dashboard.html";
}

export function requireAuth(expectedRole = null) {
  const session = getSession();
  if (!session?.user) {
    window.location.href = "login.html";
    return null;
  }

  if (expectedRole && session.user.role !== expectedRole) {
    window.location.href = roleHome(session.user.role);
    return null;
  }

  return session;
}

export function logout() {
  clearSession();
  window.location.href = "login.html";
}

export async function doLogin(email) {
  const result = await apiPost("/auth/login", { email: String(email || "").trim() });
  if (!result.ok) return result;

  setSession({ token: result.token, user: result.user });
  return result;
}

const form = document.getElementById("login-form");
if (form) {
  const emailInput = document.getElementById("email");
  const messageNode = document.getElementById("message") || document.getElementById("notice");

  const existing = getSession();
  if (existing?.user?.role) {
    window.location.href = roleHome(existing.user.role);
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    setMessage(messageNode, "Signing in...", "info");
    const result = await doLogin(emailInput.value);

    if (!result.ok) {
      setMessage(messageNode, result.message || "Login failed.", "error");
      return;
    }

    setMessage(messageNode, "Success! Redirecting...", "success");
    window.location.href = roleHome(result.user.role);
  });
}
