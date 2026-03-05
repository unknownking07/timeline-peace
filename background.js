// Timeline Peace - Background Service Worker
// Handles badge updates

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "updateBadge") {
    const count = msg.count || 0;
    const text = count > 0 ? String(count) : "";
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: "#1d9bf0" });
    chrome.storage.sync.set({ hiddenCount: count });
  }
});
