import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../../");

// Copy manifest.json
fs.copyFileSync(
  path.join(rootDir, "manifest.json"),
  path.join(rootDir, "dist/manifest.json")
);

// Create icons directory
const iconsDir = path.join(rootDir, "dist/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy icons
const sourceIconsDir = path.join(rootDir, "public/icons");
if (fs.existsSync(sourceIconsDir)) {
  const iconFiles = fs.readdirSync(sourceIconsDir);
  iconFiles.forEach((file) => {
    fs.copyFileSync(path.join(sourceIconsDir, file), path.join(iconsDir, file));
  });
}

// Create data directory
const dataDir = path.join(rootDir, "dist/data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Copy all language files
const languageFiles = [
  { source: "en.txt", dest: "en.txt" },
  { source: "tl.txt", dest: "tl.txt" },
  { source: "ceb.txt", dest: "ceb.txt" },
];

languageFiles.forEach(({ source, dest }) => {
  const sourceFile = path.join(rootDir, `public/data/${source}`);
  const destFile = path.join(dataDir, dest);

  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log(`${source} copied to dist/data/`);
  } else {
    console.warn(`Warning: ${source} not found, skipping...`);
  }
});

console.log("Assets copied to dist folder");
