// Timeline Peace - Content Script
// Monitors Twitter/X timeline and hides religion-related tweets

(function () {
  "use strict";

  // Default keywords covering major religions and common religious terms
  const DEFAULT_KEYWORDS = [
    // General religious terms
    "religion", "religious", "pray", "prayer", "praying", "prayers",
    "worship", "worshipping", "faith", "faithful", "blasphemy", "blasphemous",
    "scripture", "scriptures", "sermon", "sermons", "prophet", "prophets",
    "apostle", "apostles", "salvation", "sin", "sins", "sinners",
    "holy", "holiness", "sacred", "divine", "divinity", "deity",
    "soul", "souls", "afterlife", "heaven", "hell", "purgatory",
    "miracle", "miracles", "blessing", "blessings", "blessed",
    "commandments", "resurrection", "crucifixion", "rapture",
    "pilgrim", "pilgrimage", "missionary", "missionaries",
    "atheism", "atheist", "agnostic", "theist", "theism",
    "spirituality", "spiritual", "devotion", "devotional",
    "preach", "preacher", "preaching", "congregation",
    "seminary", "theological", "theology",

    // Christianity
    "jesus", "christ", "christian", "christianity", "catholic",
    "protestant", "evangelical", "baptist", "methodist", "lutheran",
    "pentecostal", "orthodox church", "bible", "biblical", "gospel",
    "church", "churches", "pastor", "priest", "pope",
    "vatican", "psalm", "psalms", "genesis", "revelation",
    "eucharist", "communion", "baptism", "baptize",
    "crucifix", "cross of christ", "born again",
    "hallelujah", "amen", "god bless",

    // Islam
    "islam", "islamic", "muslim", "muslims", "quran", "qur'an",
    "hadith", "sunnah", "sharia", "shariah", "mosque", "masjid",
    "imam", "mufti", "fatwa", "jihad", "hijab", "niqab",
    "ramadan", "eid", "hajj", "umrah", "salah", "salat",
    "zakat", "allah", "muhammad", "prophet muhammad",
    "mecca", "medina", "kaaba", "sunni", "shia", "shiite",
    "halal", "haram", "inshallah", "mashallah", "subhanallah",
    "alhamdulillah", "bismillah", "astaghfirullah",

    // Hinduism
    "hindu", "hinduism", "hindutva", "vedic", "vedas",
    "upanishad", "bhagavad gita", "gita", "ramayana", "mahabharata",
    "temple", "mandir", "puja", "pooja", "aarti", "bhajan",
    "krishna", "shiva", "vishnu", "brahma", "ganesh", "ganesha",
    "lakshmi", "durga", "hanuman", "rama", "devi", "deva",
    "karma", "dharma", "moksha", "samsara", "reincarnation",
    "chakra", "mantra", "om", "guru", "swami", "sadhu",
    "ashram", "yoga sutra",

    // Buddhism
    "buddhism", "buddhist", "buddha", "siddhartha",
    "nirvana", "enlightenment", "zen", "dharma",
    "sangha", "sutra", "bodhisattva", "dalai lama",
    "meditation", "mindfulness", "monastery",
    "monk", "monks", "tibetan buddhism",

    // Judaism
    "judaism", "jewish", "jew", "jews", "torah", "talmud",
    "synagogue", "rabbi", "kosher", "sabbath", "shabbat",
    "hanukkah", "passover", "yom kippur", "rosh hashanah",
    "bar mitzvah", "bat mitzvah", "zionist", "zionism",
    "kibbutz", "hebrew bible", "tanakh",

    // Sikhism
    "sikh", "sikhism", "gurdwara", "guru nanak",
    "guru granth sahib", "khalsa", "turban",
    "waheguru",

    // Other
    "cult", "sect", "denomination", "fundamentalist", "fundamentalism",
    "evangelize", "proselytize", "convert to", "religious conversion",
    "god is great", "praise the lord", "glory to god",
    "church and state", "religious freedom", "religious liberty",
  ];

  let enabled = true;
  let keywords = [];
  let hiddenCount = 0;
  let customKeywords = [];

  // Build a regex from keywords for efficient matching
  let keywordRegex = null;

  function buildRegex(words) {
    if (words.length === 0) {
      keywordRegex = null;
      return;
    }
    // Escape special regex chars and build alternation
    const escaped = words.map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    // Use word boundaries for single words, looser match for phrases
    const patterns = escaped.map((w) => {
      if (w.includes(" ")) {
        return w; // phrases match as-is
      }
      return `\\b${w}\\b`;
    });
    keywordRegex = new RegExp(patterns.join("|"), "i");
  }

  // Load settings from storage
  function loadSettings() {
    chrome.storage.sync.get(
      { enabled: true, customKeywords: [], disabledDefaults: [] },
      (data) => {
        enabled = data.enabled;
        customKeywords = data.customKeywords || [];
        const disabledDefaults = new Set(data.disabledDefaults || []);
        const activeDefaults = DEFAULT_KEYWORDS.filter(
          (k) => !disabledDefaults.has(k)
        );
        keywords = [...activeDefaults, ...customKeywords];
        buildRegex(keywords);

        if (enabled) {
          scanTimeline();
        } else {
          revealAll();
        }
      }
    );
  }

  // Check if text contains religion-related content
  function containsReligiousContent(text) {
    if (!text || !keywordRegex) return false;
    return keywordRegex.test(text);
  }

  // Get the tweet article element from any child node
  function getTweetArticle(node) {
    return node.closest('article[data-testid="tweet"]');
  }

  // Get the text content of a tweet
  function getTweetText(article) {
    const textEl = article.querySelector('[data-testid="tweetText"]');
    return textEl ? textEl.textContent : "";
  }

  // Hide a single tweet
  function hideTweet(article) {
    if (article.dataset.tlpeaceHidden) return;

    article.dataset.tlpeaceHidden = "true";
    article.classList.add("tl-peace-hidden");

    // Also hide the parent cell/wrapper to remove gaps
    const cellInner = article.closest(
      '[data-testid="cellInnerDiv"]'
    );
    if (cellInner) {
      cellInner.classList.add("tl-peace-hidden");
    }

    hiddenCount++;
    updateBadge();
  }

  // Reveal a hidden tweet
  function revealTweet(article) {
    if (!article.dataset.tlpeaceHidden) return;

    delete article.dataset.tlpeaceHidden;
    article.classList.remove("tl-peace-hidden");

    const cellInner = article.closest(
      '[data-testid="cellInnerDiv"]'
    );
    if (cellInner) {
      cellInner.classList.remove("tl-peace-hidden");
    }

    hiddenCount = Math.max(0, hiddenCount - 1);
    updateBadge();
  }

  // Reveal all hidden tweets
  function revealAll() {
    document.querySelectorAll(".tl-peace-hidden").forEach((el) => {
      el.classList.remove("tl-peace-hidden");
      if (el.dataset.tlpeaceHidden) {
        delete el.dataset.tlpeaceHidden;
      }
    });
    hiddenCount = 0;
    updateBadge();
  }

  // Scan all visible tweets
  function scanTimeline() {
    if (!enabled) return;

    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach((article) => {
      const text = getTweetText(article);
      if (containsReligiousContent(text)) {
        hideTweet(article);
      }
    });
  }

  // Update badge with hidden count
  function updateBadge() {
    try {
      chrome.runtime.sendMessage({
        type: "updateBadge",
        count: hiddenCount,
      });
    } catch (e) {
      // Extension context may be invalidated
    }
  }

  // MutationObserver to catch dynamically loaded tweets
  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the added node is a tweet or contains tweets
        const articles =
          node.tagName === "ARTICLE" && node.dataset.testid === "tweet"
            ? [node]
            : node.querySelectorAll
              ? node.querySelectorAll('article[data-testid="tweet"]')
              : [];

        for (const article of articles) {
          const text = getTweetText(article);
          if (containsReligiousContent(text)) {
            hideTweet(article);
          }
        }
      }
    }
  });

  // Start observing
  function startObserver() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled || changes.customKeywords || changes.disabledDefaults) {
      loadSettings();
    }
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "getStats") {
      chrome.runtime.sendMessage({
        type: "stats",
        hiddenCount: hiddenCount,
      });
    }
    if (msg.type === "rescan") {
      hiddenCount = 0;
      revealAll();
      scanTimeline();
    }
  });

  // Initialize
  loadSettings();
  startObserver();

  console.log("[Timeline Peace] Content filter active on Twitter/X");
})();
