# 🚀 JoSan - AI-Powered Browser Extension

**JoSan** is an intelligent browser extension developed as part of an undergraduate thesis project by **Joren P. Verdad** and **Eisan Carlos B. Atamosa**. Built with modern web technologies like **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, JoSan offers a streamlined and efficient development experience—designed with users' online safety and comfort in mind.

---

## 📖 Overview

JoSan enhances your browsing experience with advanced content moderation capabilities. This extension uses AI-powered logic to filter and detect profanity, helping users maintain a safer and more respectful web environment.

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
│ └── icons/        # Extension icons (PNG, SVG)
├── src/            # Source code
│ ├── background/   # Background scripts
│ ├── content/      # Content scripts that run in web pages
│ ├── popup/        # Popup components
│ ├── options/      # Options page components
│ └── scripts/      # Utility functions and helpers
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

1. **Load the extension in your browser**

### ✅ Chrome

- Visit `chrome://extensions/`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `dist` folder
---

### 📦 For Production

1. Download the latest `.zip` or `.crx` from the [Releases](https://github.com/your-username/josan/releases) page
2. Install manually:

### Chrome:

- Go to `chrome://extensions/`
- Enable **Developer mode**
- Drag and drop the `.crx` file

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development mode |
| `npm run build` | Build the project for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint for code quality checks |

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

## 📬 Contact

For inquiries or feedback, feel free to contact the authors or [open an issue](https://github.com/your-username/josan/issues) on the repository.
