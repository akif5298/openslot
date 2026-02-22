import {
  apiRequest,
  getSession,
  setMessage,
  setSession
} from "./api.js";

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const messageNode = document.getElementById("message");

const existing = getSession();
if (existing?.user?.role === "student") {
  window.location.href = "student-dashboard.html";
}
if (existing?.user?.role === "professor") {
  window.location.href = "professor-dashboard.html";
}

form?.addEventListener("submit", async event => {
  event.preventDefault();
  const email = emailInput?.value?.trim();

  if (!email) {
    setMessage(messageNode, "Enter an email address.", "error");
    return;
  }

  try {
    setMessage(messageNode, "Signing in...", "info");
    const payload = await apiRequest("/auth/login", {
      method: "POST",
      body: { email }
    });

    setSession({ token: payload.token, user: payload.user });

    if (payload.user.role === "professor") {
      window.location.href = "professor-dashboard.html";
      return;
    }

    window.location.href = "student-dashboard.html";
  } catch (error) {
    setMessage(messageNode, error.message, "error");
  }
});
