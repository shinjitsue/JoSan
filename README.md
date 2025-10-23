# 🚀 JoSan - AI-Powered Browser Extension

**JoSan** is an intelligent browser extension developed as part of an undergraduate thesis project by **Joren P. Verdad** and **Eisan Carlos B. Atamosa**. Built with modern web technologies like **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, JoSan offers a streamlined and efficient development experience—designed with users' online safety and comfort in mind.

---

## 📖 Overview

JoSan enhances your browsing experience with advanced content moderation capabilities. This extension uses AI-powered logic to filter and detect profanity, helping users maintain a safer and more respectful web environment.

![image](https://github.com/user-attachments/assets/bc367ab3-ba3a-416b-9c48-201129e8a316)

---

## ✨ Features

- ⚛️ Built with **React** for a responsive and modular UI
- 🛡️ **Profanity detection** in multiple languages
- ⚙️ Developed with **TypeScript** for strong type safety
- 💨 Lightning-fast builds using **Vite**
- 🎨 Styled with **Tailwind CSS**
- 🌐 Uses Chrome Extension APIs
- 🧩 Includes a **popup** interface and **options** page
- 🔧 Modular and maintainable project structure
- 🔒 **Privacy-first design** - filters only public feeds, never private messages

---

## 🧠 Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Chrome Extension APIs

---

## 🗂️ Project Structure

```
josan/
├── public/         # Static assets
│   ├── icons/      # Extension icons (PNG, SVG)
│   └── data/       # Profanity word lists
├── src/            # Source code
│   ├── background/ # Background scripts
│   ├── content/    # Content scripts that run in web pages
│   ├── popup/      # Popup components
│   ├── options/    # Options page components
│   └── scripts/    # Utility functions and helpers
├── dist/           # Production-ready build output
├── release/        # Final packaged builds (.crx) for distribution
├── manifest.json   # Extension manifest (v3)
└── vite.config.ts  # Vite configuration
```

## 🧰 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **Yarn**
- A Chromium-based browser (Chrome)

---

## 🛠️ Installation

### 🔧 For Development

1. **Clone the repository**

```bash
git clone https://github.com/your-username/josan.git
cd josan
```

2. **Install dependencies**

```bash
npm install
# or
yarn
```

3. **Start development server**

```bash
npm run dev
# or
yarn dev
```

4. **Load the extension in your browser**

   ✅ Chrome

   - Visit `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `dist` folder

5. **The extension should now be installed and ready for testing**

---

### 📦 For Production

1. Download the latest `.zip` or `.crx` from the [Releases](https://github.com/shinjitsue/JoSan/tree/main/release) page
2. Install manually:

### Chrome:

- Go to `chrome://extensions/`
- Enable **Developer mode**
- Drag and drop the `.crx` file

---

## 📜 Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start development mode               |
| `npm run build`   | Build the project for production     |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint for code quality checks   |

---

## 🏗️ Building the Extension

```bash
npm run build
# or
yarn build
```

The build output will be available inside the `dist/` folder.

---

## 🛠️ Customization Guide

- Modify **popup UI**: `src/popup/`
- Customize **options page**: `src/options/`
- Update **background logic**: `src/background/`
- Edit metadata: `manifest.json`

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repo
2. Create a new branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m "Add amazing feature"
   ```

4. Push to GitHub:

   ```bash
   git push origin feature/amazing-feature
   ```

5. Open a Pull Request ✅

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**. See the LICENSE file for details.

---

## 👨‍🎓 Authors

- **Joren P. Verdad**
- **Eisan Carlos B. Atamosa**

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🛡️ Privacy & Security

**JoSan is designed with privacy as the top priority:**

- 🔒 **Public Feeds Only**: Filters only public social media feeds and comments
- 💻 **100% Local Processing**: All filtering happens on your device
- 🚫 **Zero Data Collection**: No tracking, no analytics, no external servers
- 🔐 **Minimal Permissions**: Only accesses specific social media domains
- 🚷 **Private Content Protected**: Automatically excludes:
  - Direct messages (DMs)
  - Private conversations
  - Chat/inbox areas
  - Input fields and forms
  - Password fields

See [SECURITY.md](./SECURITY.md) for detailed security information.

## 🌐 Supported Platforms

JoSan actively filters profanity on **12 major social media platforms**:

### ✅ Currently Supported

| Platform  | Filtered Areas               | Private Areas Excluded       |
| --------- | ---------------------------- | ---------------------------- |
| Facebook  | News Feed, Posts, Comments   | Messenger, DMs               |
| Twitter/X | Timeline, Tweets, Replies    | Direct Messages              |
| Instagram | Feed, Stories, Comments      | Instagram Direct             |
| Reddit    | Posts, Comments, Subreddits  | Chat, Private Messages       |
| LinkedIn  | Feed, Posts, Comments        | LinkedIn Messaging           |
| TikTok    | For You Page, Comments       | TikTok Messages              |
| YouTube   | Comments, Community Posts    | Private Messages             |
| Tumblr    | Dashboard, Posts, Reblogs    | Tumblr Messaging             |
| Quora     | Answers, Comments, Spaces    | Quora Messages               |
| Threads   | Feed, Threads, Replies       | Threads DMs                  |
| Discord   | Public Servers/Channels Only | Direct Messages, Group Chats |
| BlueSky   | Feed, Posts, Replies         | Private Messages             |

### 🎯 Filter Scope

**What JoSan Filters:**

- ✅ Public posts and status updates
- ✅ Comments and replies
- ✅ Public timelines and feeds
- ✅ Community content
- ✅ Public channel messages (Discord only)

**What JoSan NEVER Filters:**

- ❌ Direct messages (DMs)
- ❌ Private conversations
- ❌ Chat/inbox areas
- ❌ Input fields you're typing in
- ❌ Password fields
- ❌ Forms and text editors
- ❌ Private channels (Discord)

### 🔧 Platform Selection

Users can enable/disable filtering for each platform individually through the **Options** page. Disabled platforms will not be filtered at all, giving you complete control over where JoSan is active.

---

## 📬 Contact

For inquiries or feedback, feel free to contact the authors or [open an issue](https://github.com/shinjitsue/JoSan/issues) on the repository.
