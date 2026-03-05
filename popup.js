// Timeline Peace - Popup Script

const toggleEnabled = document.getElementById("toggleEnabled");
const hiddenCountEl = document.getElementById("hiddenCount");
const statusDot = document.getElementById("statusDot");
const keywordInput = document.getElementById("keywordInput");
const addKeywordBtn = document.getElementById("addKeyword");
const customKeywordsList = document.getElementById("customKeywordsList");
const blockedLogEl = document.getElementById("blockedLog");
const clearLogBtn = document.getElementById("clearLog");

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

// Load blocked tweets log
function loadBlockedLog() {
  chrome.storage.local.get({ blockedLog: [] }, (data) => {
    renderBlockedLog(data.blockedLog || []);
  });
}

// Render blocked tweets log
function renderBlockedLog(log) {
  if (log.length === 0) {
    blockedLogEl.innerHTML =
      '<span class="empty-state">No blocked tweets yet. Browse X/Twitter to see filtering in action.</span>';
    return;
  }

  blockedLogEl.innerHTML = log
    .map((entry) => {
      const timeAgo = getTimeAgo(entry.time);
      return (
        '<div class="blocked-item">' +
          '<div class="blocked-item-header">' +
            '<span class="blocked-item-author">' + escapeHtml(entry.author) + '</span>' +
            '<span class="blocked-item-keyword">' + escapeHtml(entry.keyword) + '</span>' +
          '</div>' +
          '<div class="blocked-item-text">' + escapeHtml(entry.text) + '</div>' +
        '</div>'
      );
    })
    .join("");
}

// Time ago helper
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  return Math.floor(hours / 24) + "d ago";
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

// Clear blocked log
clearLogBtn.addEventListener("click", () => {
  chrome.storage.local.set({ blockedLog: [] }, () => {
    renderBlockedLog([]);
  });
});

// Listen for stats updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "stats" || msg.type === "updateBadge") {
    const count = msg.hiddenCount ?? msg.count ?? 0;
    hiddenCountEl.textContent = count;
    chrome.storage.sync.set({ hiddenCount: count });
  }
});

// Request stats from content script on open and load log
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "getStats" }, (response) => {
      if (response) {
        hiddenCountEl.textContent = response.hiddenCount || 0;
        if (response.blockedLog) {
          renderBlockedLog(response.blockedLog);
          return;
        }
      }
      // Fallback: load from storage
      loadBlockedLog();
    });
  } else {
    loadBlockedLog();
  }
});

loadSettings();
