# 🔒 Security & Privacy Policy

## Mission Statement

**JoSan is committed to protecting your privacy while providing effective profanity filtering.** We believe that content moderation should never come at the cost of user privacy. This document explains how we achieve this balance.

---

## 🎯 What JoSan Does

JoSan filters profanity **only in public social media feeds** on these platforms:

- ✅ **Facebook** - News Feed, Posts, Comments
- ✅ **Twitter/X** - Timeline, Tweets, Replies
- ✅ **Instagram** - Feed, Stories, Comments
- ✅ **Reddit** - Posts, Comments, Subreddits
- ✅ **LinkedIn** - Feed, Posts, Comments
- ✅ **TikTok** - For You Page, Comments
- ✅ **YouTube** - Comments, Community Posts
- ✅ **Tumblr** - Dashboard, Posts, Reblogs
- ✅ **Quora** - Answers, Comments, Spaces
- ✅ **Threads** - Feed, Threads, Replies
- ✅ **Discord** - Public Servers/Channels Only
- ✅ **BlueSky** - Feed, Posts, Replies

### Processing Details

- All text filtering happens **locally** on your device
- No data is ever transmitted to external servers
- Filter word list is stored locally in the extension
- Statistics (word count, page scans) are stored in Chrome's local storage

---

## 🚫 What JoSan DOES NOT Do

### Private Content Protection

JoSan **explicitly excludes** these areas from filtering:

#### ❌ Direct Messages & Private Conversations

- Facebook Messenger
- Instagram Direct
- Twitter/X DMs
- Reddit Chat
- LinkedIn Messaging
- TikTok Messages
- Tumblr Messages
- Quora Messages
- Threads DMs
- Discord Direct Messages & Group Chats
- BlueSky Private Messages

#### ❌ Input Fields & Forms

- Text areas you're typing in
- Password fields
- Login forms
- Comment composers (while typing)
- Search boxes
- All `contenteditable` fields

#### ❌ Personal Data

- Profile information
- Settings pages
- Account details
- Email addresses
- Phone numbers
- Inbox/notification areas

---

## 🛠️ Technical Implementation

### 1. Selective Processing Architecture

```typescript
// JoSan uses two selector arrays:

// FEED_SELECTORS: What we filter
FEED_SELECTORS = [
  'div[role="feed"]', // Facebook feed
  'article[data-testid="tweet"]', // Twitter posts
  "ytd-comment-thread-renderer", // YouTube comments
  // ... 40+ platform-specific feed selectors
];

// PRIVATE_SELECTORS: What we skip
PRIVATE_SELECTORS = [
  '[data-testid*="message"]', // Message areas
  '[class*="chat"]', // Chat interfaces
  '[class*="dm"]', // Direct messages
  '[aria-label*="conversation"]', // Conversation threads
  'input[type="password"]', // Password fields
  // ... 20+ private content patterns
];
```

### 2. Privacy-First Logic Flow

```
1. Page loads → Detect platform
2. Check if platform is enabled
3. Find feed containers using FEED_SELECTORS
4. For each element:
   ├─ Check against PRIVATE_SELECTORS
   ├─ If match → SKIP (preserve privacy)
   └─ If no match → Filter text
5. Never store filtered content
```

### 3. Platform Detection

JoSan detects the current platform by hostname:

```typescript
detectPlatform(): string {
  if (hostname.includes("facebook.com")) return "facebook";
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
  // ... 12 platforms total
  return "unknown"; // If not supported, don't filter
}
```

**If platform is not in the supported list, JoSan does nothing.**

---

## 🔐 Data Handling & Storage

### What Gets Stored Locally

| Data Type        | Storage Location       | Purpose                     | Synced? |
| ---------------- | ---------------------- | --------------------------- | ------- |
| Filter word list | `dist/data/en.txt`     | Profanity detection         | No      |
| Custom words     | `chrome.storage.local` | User-added filter words     | No      |
| Enabled state    | `chrome.storage.local` | Filter on/off preference    | No      |
| Platform toggles | `chrome.storage.local` | Per-platform enable/disable | No      |
| Statistics       | `chrome.storage.local` | Word count, page scans      | No      |

### What Is NEVER Stored

- ❌ Filtered text content
- ❌ URLs of visited pages
- ❌ User's browsing history
- ❌ Personal information
- ❌ Message content
- ❌ Any data sent to external servers

---

## 🔍 Permissions Explained

JoSan requests minimal permissions:

### `storage` Permission

- **Why**: To save your filter preferences locally
- **Scope**: Chrome's local storage API only (not synced across devices)
- **Data**: Filter state, custom words, statistics

### `host_permissions` (13 domains)

- **Why**: To run content scripts on supported platforms
- **Scope**: Only the 12 social media platforms we support
- **Limitation**: Cannot access other websites

```json
"host_permissions": [
  "*://*.facebook.com/*",
  "*://*.twitter.com/*",
  "*://*.x.com/*",
  "*://*.instagram.com/*",
  "*://*.reddit.com/*",
  "*://*.linkedin.com/*",
  "*://*.tiktok.com/*",
  "*://*.youtube.com/*",
  "*://*.tumblr.com/*",
  "*://*.quora.com/*",
  "*://*.threads.net/*",
  "*://*.discord.com/*",
  "*://*.bsky.app/*"
]
```

### Permissions We DON'T Request

- ❌ `cookies` - We don't access your cookies
- ❌ `history` - We don't read your browsing history
- ❌ `tabs` - We don't monitor your open tabs
- ❌ `webRequest` - We don't intercept network requests
- ❌ `<all_urls>` - We only work on supported platforms

---

## 🛡️ Security Features

### 1. Content Security Policy

- No external scripts allowed
- All code runs locally
- No inline JavaScript evaluation
- No remote code loading

### 2. Manifest V3 Compliance

JoSan uses Chrome's **Manifest V3**, the most secure extension format:

- Service worker instead of background pages
- Declarative permissions
- Enhanced security sandbox

### 3. Open Source Transparency

- **All code is public** on GitHub
- Community can audit for security issues
- No obfuscated or hidden code
- Licensed under GNU GPL v3.0

---

## 🚨 Privacy Violations We Prevent

### 1. Message/DM Access

**Problem**: Many filter extensions read private messages.

**JoSan Solution**:

```typescript
PRIVATE_SELECTORS = [
  '[data-testid*="message"]',
  '[class*="chat"]',
  '[class*="dm"]',
  '[aria-label*="Direct Messages"]',
  // ... comprehensive blacklist
];

if (isPrivateContent(element)) {
  console.log("[JoSan] Skipping private content area");
  return; // Don't filter
}
```

### 2. Input Field Monitoring

**Problem**: Reading what users type in real-time.

**JoSan Solution**:

```typescript
PRIVATE_SELECTORS = [
  'input[type="password"]',
  "textarea",
  'input[type="text"]',
  '[contenteditable="true"]',
  '[role="textbox"]',
];
```

### 3. Data Exfiltration

**Problem**: Sending filtered content to servers.

**JoSan Solution**:

- ✅ Zero network requests after initial load
- ✅ No analytics or tracking code
- ✅ No external API calls
- ✅ All processing is local

---

## 📊 Statistics Collection

JoSan tracks **only** these anonymous metrics locally:

- **Blocked Words Count**: How many profane words were filtered
- **Pages Scanned**: Number of pages processed
- **Last Scan Time**: Timestamp of last filter run

**What we DON'T track:**

- ❌ Which words were blocked
- ❌ Where words appeared
- ❌ What URLs you visited
- ❌ Any identifying information

---

## 🔄 Data Lifecycle

```
1. Install → Load filter word list (data/en.txt)
2. Configure → Save preferences locally
3. Browse → Filter public feeds only
4. Update → Statistics saved to chrome.storage.local
5. Uninstall → All data deleted automatically
```

**No data persists after uninstallation.**

---

## 🧪 Privacy Testing

You can verify JoSan's privacy claims:

### Test 1: Network Activity

```bash
# Open Chrome DevTools → Network tab
# Browse social media with JoSan enabled
# Observe: Zero requests to external servers
```

### Test 2: Private Content Skipping

```bash
# Open a social media DM/chat
# Type profanity in the message box
# Observe: Text is NOT filtered (as intended)
```

### Test 3: Storage Inspection

```bash
# Open Chrome DevTools → Application → Storage
# View: chrome.storage.local
# Observe: Only preferences, no content data
```

---
