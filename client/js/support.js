import { initials, setMessage } from "./api.js";
import { logout, requireAuth } from "./auth.js";

const session = requireAuth();
if (!session) throw new Error("No active session");

const avatarNode = document.getElementById("user-avatar");
const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("faq-search");
const faqItems = Array.from(document.querySelectorAll(".faq-item"));
const contactBtn = document.getElementById("contact-support");
const noticeNode = document.getElementById("notice");

avatarNode.textContent = initials(session.user.name);
logoutBtn?.addEventListener("click", logout);

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function applyFaqFilter() {
  const query = normalize(searchInput.value);
  let visibleCount = 0;

  faqItems.forEach(item => {
    const summary = item.querySelector("summary")?.textContent || "";
    const content = item.textContent || "";
    const visible = !query || normalize(`${summary} ${content}`).includes(query);
    item.style.display = visible ? "block" : "none";
    if (visible) visibleCount += 1;
  });

  if (!query) {
    setMessage(noticeNode, "", "info");
    return;
  }

  setMessage(
    noticeNode,
    visibleCount ? `${visibleCount} matching help article(s).` : "No FAQ entries matched your search.",
    visibleCount ? "info" : "error"
  );
}

searchInput?.addEventListener("input", applyFaqFilter);
contactBtn?.addEventListener("click", () => {
  setMessage(noticeNode, "Support request captured. Our team will follow up by email.", "success");
});
