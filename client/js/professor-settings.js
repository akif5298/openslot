import { apiPatch, initials, setMessage, setSession } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth("professor");
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const profileAvatarNode = document.getElementById("profile-avatar");
const logoutBtn = document.getElementById("logout-btn");
const form = document.getElementById("settings-form");
const cancelBtn = document.getElementById("cancel-settings");
const nameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const officeInput = document.getElementById("office");
const bioInput = document.getElementById("bio");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
profileAvatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

function hydrateForm() {
  nameInput.value = session.user.name || "";
  emailInput.value = session.user.email || "";
  officeInput.value = session.user.office_location || "";
  bioInput.value = session.user.bio || "";
}

hydrateForm();

cancelBtn?.addEventListener("click", () => {
  hydrateForm();
  setMessage(noticeNode, "Changes discarded.", "info");
});

form?.addEventListener("submit", async event => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    office_location: officeInput.value.trim(),
    bio: bioInput.value.trim()
  };

  if (!payload.name || !payload.email) {
    setMessage(noticeNode, "Name and email are required.", "error");
    return;
  }

  setMessage(noticeNode, "Saving profile...", "info");
  const result = await apiPatch(`/auth/profile/${session.user.user_id}`, payload);
  if (!result.ok) {
    setMessage(noticeNode, result.message || "Failed to save profile.", "error");
    return;
  }

  const nextSession = {
    ...session,
    user: {
      ...session.user,
      ...result.user
    }
  };
  setSession(nextSession);
  session.user = nextSession.user;

  avatarNode.textContent = initials(session.user.name);
  profileAvatarNode.textContent = initials(session.user.name);
  setMessage(noticeNode, "Profile updated successfully.", "success");
});
