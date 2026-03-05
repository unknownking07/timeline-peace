# 🛡️ Timeline Peace

**Filter religion-related content from your X/Twitter timeline.**

Timeline Peace is a browser extension that silently removes religion-related tweets from your feed — like an ad blocker, but for content you'd rather not see.

🌐 **Website:** [timeline-peace-on-x.vercel.app](https://timeline-peace-on-x.vercel.app)

---

## How It Works

1. **Monitors your timeline** — A DOM observer watches for new tweets as they load (just like ad blockers)
2. **Scans tweet text** — Each tweet is checked against 200+ religion-related keywords using fast regex matching
3. **Hides matches instantly** — Matching tweets vanish with no gaps or placeholders
4. **Keeps count** — The badge shows how many tweets were filtered in your session

## Features

- **Instant filtering** — Tweets are hidden the moment they appear, no flicker
- **200+ built-in keywords** — Covers Christianity, Islam, Hinduism, Buddhism, Judaism, Sikhism, and general religious terms
- **Custom keywords** — Add your own terms to filter
- **Toggle on/off** — One-click enable/disable from the popup
- **Live counter** — Badge shows filtered tweet count
- **100% private** — Everything runs locally. Zero data sent anywhere

## Installation

> Works on all Chromium-based browsers: **Chrome, Edge, Brave, Opera, Arc, Vivaldi**

1. **Download** the latest release zip from the [website](https://timeline-peace-on-x.vercel.app) or clone this repo
2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
   - Arc: `arc://extensions`
   - Vivaldi: `vivaldi://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the folder containing `manifest.json` (the repo root, not the `website/` folder)
6. Visit [x.com](https://x.com) — the filter is active immediately

## Project Structure

```
├── manifest.json       # Chrome Extension Manifest V3
├── content.js          # Content script — DOM observer + keyword matching
├── background.js       # Service worker — badge counter
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic — toggle, custom keywords
├── styles.css          # CSS to hide filtered tweets
├── icons/              # Extension icons (16/48/128px)
├── vercel.json         # Vercel deployment config
└── website/            # Landing page website
    ├── index.html
    ├── style.css
    └── timeline-peace-extension.zip
```

## Usage

- Click the **Timeline Peace** icon in your toolbar to open the popup
- Use the **toggle** to enable/disable filtering
- Add **custom keywords** to filter additional content
- The **badge number** shows how many tweets have been hidden

## Privacy

This extension:
- Runs **100% locally** in your browser
- Sends **zero data** to any server
- Requires **no account** or sign-up
- Has **no analytics** or tracking
- Only requests permissions for `x.com` and `twitter.com`

## License

MIT
