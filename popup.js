// Timeline Peace - Popup Script

const toggleEnabled = document.getElementById("toggleEnabled");
const hiddenCountEl = document.getElementById("hiddenCount");
const statusDot = document.getElementById("statusDot");
const keywordInput = document.getElementById("keywordInput");
const addKeywordBtn = document.getElementById("addKeyword");
const customKeywordsList = document.getElementById("customKeywordsList");

// Load current settings
function loadSettings() {
  chrome.storage.sync.get(
    { enabled: true, customKeywords: [], hiddenCount: 0 },
    (data) => {
      toggleEnabled.checked = data.enabled;
      statusDot.className = data.enabled ? "status-dot" : "status-dot off";
      hiddenCountEl.textContent = data.hiddenCount || 0;
      renderCustomKeywords(data.customKeywords || []);
    }
  );
}

// Render custom keyword tags
function renderCustomKeywords(keywords) {
  if (keywords.length === 0) {
    customKeywordsList.innerHTML =
      '<span class="empty-state">No custom keywords added yet</span>';
    return;
  }

  customKeywordsList.innerHTML = keywords
    .map(
      (kw) =>
        `<span class="keyword-tag">${escapeHtml(kw)}<span class="remove" data-keyword="${escapeHtml(kw)}">×</span></span>`
    )
    .join("");

  // Add remove handlers
  customKeywordsList.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeKeyword(btn.dataset.keyword);
    });
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Toggle enable/disable
toggleEnabled.addEventListener("change", () => {
  const enabled = toggleEnabled.checked;
  chrome.storage.sync.set({ enabled });
  statusDot.className = enabled ? "status-dot" : "status-dot off";
});

// Add keyword
function addKeyword() {
  const keyword = keywordInput.value.trim().toLowerCase();
  if (!keyword) return;

  chrome.storage.sync.get({ customKeywords: [] }, (data) => {
    const keywords = data.customKeywords || [];
    if (keywords.includes(keyword)) {
      keywordInput.value = "";
      return;
    }
    keywords.push(keyword);
    chrome.storage.sync.set({ customKeywords: keywords }, () => {
      keywordInput.value = "";
      renderCustomKeywords(keywords);
    });
  });
}

addKeywordBtn.addEventListener("click", addKeyword);
keywordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addKeyword();
});

// Remove keyword
function removeKeyword(keyword) {
  chrome.storage.sync.get({ customKeywords: [] }, (data) => {
    const keywords = (data.customKeywords || []).filter((k) => k !== keyword);
    chrome.storage.sync.set({ customKeywords: keywords }, () => {
      renderCustomKeywords(keywords);
    });
  });
}

// Listen for stats updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "stats" || msg.type === "updateBadge") {
    const count = msg.hiddenCount ?? msg.count ?? 0;
    hiddenCountEl.textContent = count;
    chrome.storage.sync.set({ hiddenCount: count });
  }
});

// Request stats from content script on open
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "getStats" }).catch(() => {});
  }
});

loadSettings();
