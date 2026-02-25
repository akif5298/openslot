import { apiPost, clearSession, getSession, setMessage, setSession } from "./api.js";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const messageNode = document.getElementById("message") || document.getElementById("notice");

export function requireAuth() {
  const session = getSession();
  if (!session?.user) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

export function logout() {
  clearSession();
  window.location.href = "login.html";
}

export async function doLogin(email) {
  const normalized = String(email || "").trim();
  if (!normalized) {
    return { ok: false, message: "Enter an email address." };
  }

  const result = await apiPost("/auth/login", { email: normalized });
  if (!result.ok) {
    return result;
  }

  setSession({ token: result.token, user: result.user });
  return result;
}

function redirectToRolePage(role) {
  window.location.href = role === "professor" ? "professor-dashboard.html" : "student-dashboard.html";
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  const email = emailInput?.value?.trim();

  setMessage(messageNode, "Signing in...", "info");
  const result = await doLogin(email);

  if (!result.ok) {
    setMessage(messageNode, result.message || "Login failed.", "error");
    return;
  }

  setMessage(messageNode, "Success! Redirecting...", "success");
  redirectToRolePage(result.user.role);
}

const isLoginPage = Boolean(loginForm || loginButton);
if (isLoginPage) {
  const existing = getSession();
  if (existing?.user?.role) {
    redirectToRolePage(existing.user.role);
  }

  loginForm?.addEventListener("submit", handleLogin);
  loginButton?.addEventListener("click", handleLogin);
}
