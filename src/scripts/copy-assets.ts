import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../../");

// Copy manifest.json to dist folder
fs.copyFileSync(
  path.join(rootDir, "manifest.json"),
  path.join(rootDir, "dist/manifest.json")
);

// Create icons folder if it doesn't exist
const iconsDir = path.join(rootDir, "dist/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy icons if they exist
const sourceIconsDir = path.join(rootDir, "public/icons");
if (fs.existsSync(sourceIconsDir)) {
  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Copy all files from public/icons to dist/icons
  const iconFiles = fs.readdirSync(sourceIconsDir);
  iconFiles.forEach((file) => {
    fs.copyFileSync(path.join(sourceIconsDir, file), path.join(iconsDir, file));
  });
}

console.log("Assets copied to dist folder");
