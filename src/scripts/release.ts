/**
 * Release packaging script for JoSan Chrome Extension
 *
 * Automates:
 * - Version synchronization across manifest.json and package.json
 * - Extension build
 * - CRX packaging with existing private key
 * - ZIP creation for Chrome Web Store
 * - Organized output to release/vX/ folder structure
 *
 * Usage:
 *   npm run release          # Package current version
 *   npm run release 2.2.0    # Package specific version
 *
 * @packageDocumentation
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { createWriteStream } from "fs";
import { fileURLToPath } from "url";

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for archiver (ESM compatible)
async function getArchiver(): Promise<typeof import("archiver")> {
  const archiver = await import("archiver");
  return archiver.default;
}

interface ReleaseConfig {
  name: string;
  version: string;
  distPath: string;
  releasePath: string;
  pemPath: string;
  rootPath: string;
}

interface ManifestJson {
  version: string;
  version_name?: string;
  [key: string]: unknown;
}

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

/**
 * Read and parse configuration from manifest.json
 */
function getConfig(): ReleaseConfig {
  const rootPath = path.resolve(__dirname, "../..");
  const manifestPath = path.join(rootPath, "manifest.json");
  const manifest: ManifestJson = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );

  return {
    name: "josan",
    version: manifest.version,
    distPath: path.join(rootPath, "dist"),
    releasePath: path.join(rootPath, "release"),
    pemPath: path.join(rootPath, "release", "josan.pem"),
    rootPath,
  };
}

/**
 * Extract major version for folder organization
 * "2.1.0" → "v2"
 */
function getMajorVersion(version: string): string {
  const major = version.split(".")[0];
  return `v${major}`;
}

/**
 * Ensure directory exists, creating recursively if needed
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Validate version string format
 */
function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  return versionRegex.test(version);
}

/**
 * Create ZIP archive of dist folder for Chrome Web Store
 */
async function createZipArchive(
  sourcePath: string,
  outputPath: string,
): Promise<void> {
  const archiver = await getArchiver();

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      const sizeKB = (archive.pointer() / 1024).toFixed(2);
      console.log(
        `📦 ZIP created: ${path.basename(outputPath)} (${sizeKB} KB)`,
      );
      resolve();
    });

    archive.on("error", (err: Error) => reject(err));
    archive.pipe(output);
    archive.directory(sourcePath, false);
    archive.finalize();
  });
}

/**
 * Get Chrome executable path based on platform
 */
function getChromePath(): string {
  switch (process.platform) {
    case "win32": {
      // Check common Windows Chrome locations
      const windowsPaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      ];
      for (const chromePath of windowsPaths) {
        if (fs.existsSync(chromePath)) {
          return `"${chromePath}"`;
        }
      }
      return '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
    }

    case "darwin":
      return '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';

    case "linux":
      return "google-chrome";

    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

/**
 * Pack extension to CRX using Chrome command line
 */
function packCrx(config: ReleaseConfig, outputPath: string): void {
  const chromePath = getChromePath();

  // Build the command
  const command = `${chromePath} --pack-extension="${config.distPath}" --pack-extension-key="${config.pemPath}"`;

  console.log(`\n🔧 Running: Chrome CRX packer`);

  try {
    execSync(command, {
      stdio: "pipe",
      windowsHide: true,
    });

    // Chrome outputs to parent directory as dist.crx
    const generatedCrx = path.join(config.rootPath, "dist.crx");

    if (fs.existsSync(generatedCrx)) {
      // Move to proper location with correct name
      fs.renameSync(generatedCrx, outputPath);
      const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(2);
      console.log(
        `📦 CRX created: ${path.basename(outputPath)} (${sizeKB} KB)`,
      );
    } else {
      throw new Error("CRX file was not generated");
    }
  } catch (error) {
    console.error("\n❌ Failed to pack CRX");
    console.error("   Ensure Chrome is installed and accessible.");
    console.error("   You may need to pack manually via chrome://extensions/");
    throw error;
  }
}

/**
 * Update version in manifest.json and package.json
 */
function updateVersionInFiles(
  config: ReleaseConfig,
  newVersion: string,
  prerelease?: string,
): void {
  // Update manifest.json
  const manifestPath = path.join(config.rootPath, "manifest.json");
  const manifest: ManifestJson = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );

  manifest.version = newVersion;
  manifest.version_name = prerelease
    ? `${newVersion} ${prerelease}`
    : `${newVersion} Stable`;

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`📝 Updated manifest.json → v${newVersion}`);

  // Update package.json
  const packagePath = path.join(config.rootPath, "package.json");
  const packageJson: PackageJson = JSON.parse(
    fs.readFileSync(packagePath, "utf-8"),
  );

  packageJson.version = newVersion;

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`📝 Updated package.json → v${newVersion}`);
}

/**
 * Generate release notes template
 */
function generateReleaseNotesTemplate(
  versionFolder: string,
  version: string,
): void {
  const notesPath = path.join(versionFolder, `release-notes-v${version}.md`);

  if (fs.existsSync(notesPath)) {
    console.log(`📋 Release notes already exist: ${path.basename(notesPath)}`);
    return;
  }

  const template = `# JoSan v${version} Release Notes

**Release Date:** ${new Date().toISOString().split("T")[0]}
**Release Type:** Stable

## Highlights

Brief summary of key changes in this release.

## What's New

### Features
- Feature 1 description
- Feature 2 description

### Improvements
- Improvement 1
- Improvement 2

### Bug Fixes
- Fix 1
- Fix 2

## Breaking Changes

None in this release.

## Upgrade Notes

Standard upgrade - replace previous version.

## Known Issues

None currently known.

---

Full changelog: [CHANGELOG.md](../../CHANGELOG.md)
`;

  fs.writeFileSync(notesPath, template);
  console.log(`📋 Created release notes template: ${path.basename(notesPath)}`);
}

/**
 * Main release function
 */
async function release(targetVersion?: string): Promise<void> {
  console.log("\n" + "═".repeat(50));
  console.log("🚀 JoSan Chrome Extension Release Packager");
  console.log("═".repeat(50) + "\n");

  const config = getConfig();
  let version = targetVersion || config.version;
  let prerelease: string | undefined;

  // Parse prerelease suffix (e.g., "2.2.0-beta.1")
  if (version.includes("-")) {
    const parts = version.split("-");
    version = parts[0];
    prerelease = parts[1];
  }

  // Validate version format
  const fullVersion = prerelease ? `${version}-${prerelease}` : version;
  if (!isValidVersion(fullVersion)) {
    console.error(`❌ Invalid version format: ${fullVersion}`);
    console.error("   Expected format: MAJOR.MINOR.PATCH[-prerelease]");
    console.error("   Examples: 2.1.0, 2.2.0-beta.1, 3.0.0-rc.1");
    process.exit(1);
  }

  const majorFolder = getMajorVersion(version);

  console.log(`📋 Release Configuration:`);
  console.log(`   Version: ${fullVersion}`);
  console.log(`   Folder:  release/${majorFolder}/`);
  console.log(`   Type:    ${prerelease || "Stable"}`);
  console.log("");

  // Check for private key
  if (!fs.existsSync(config.pemPath)) {
    console.error(`❌ Private key not found: ${config.pemPath}`);
    console.error("");
    console.error("   First-time setup requires manual packaging:");
    console.error("   1. Go to chrome://extensions/");
    console.error("   2. Enable Developer Mode");
    console.error("   3. Click 'Pack extension'");
    console.error("   4. Select dist/ folder");
    console.error("   5. Leave private key empty (generates new)");
    console.error("   6. Move generated .pem to release/josan.pem");
    console.error("");
    process.exit(1);
  }

  // Ensure release folder structure
  const versionFolder = path.join(config.releasePath, majorFolder);
  ensureDirectoryExists(versionFolder);

  // Update version if different from current
  if (fullVersion !== config.version) {
    console.log(`📝 Updating version: ${config.version} → ${fullVersion}`);
    updateVersionInFiles(config, version, prerelease);
    config.version = fullVersion;
  }

  // Build extension
  console.log("\n🔨 Building extension...");
  try {
    execSync("npm run build", {
      cwd: config.rootPath,
      stdio: "inherit",
    });
  } catch {
    console.error("\n❌ Build failed");
    process.exit(1);
  }

  // Verify dist exists
  if (!fs.existsSync(config.distPath)) {
    console.error("\n❌ dist/ folder not found after build");
    process.exit(1);
  }

  // Define output paths
  const crxFilename = `josan-v${fullVersion}.crx`;
  const zipFilename = `josan-v${fullVersion}.zip`;
  const crxPath = path.join(versionFolder, crxFilename);
  const zipPath = path.join(versionFolder, zipFilename);

  // Pack CRX
  console.log("\n📦 Packaging CRX...");
  packCrx(config, crxPath);

  // Create ZIP for Chrome Web Store
  console.log("\n📦 Creating ZIP archive...");
  await createZipArchive(config.distPath, zipPath);

  // Update latest/ folder
  console.log("\n📋 Updating latest/ folder...");
  const latestFolder = path.join(config.releasePath, "latest");
  ensureDirectoryExists(latestFolder);

  const latestCrx = path.join(latestFolder, "josan-latest.crx");
  const latestZip = path.join(latestFolder, "josan-latest.zip");

  fs.copyFileSync(crxPath, latestCrx);
  fs.copyFileSync(zipPath, latestZip);
  console.log(`   → josan-latest.crx`);
  console.log(`   → josan-latest.zip`);

  // Generate release notes template
  console.log("\n📋 Generating release notes...");
  generateReleaseNotesTemplate(versionFolder, fullVersion);

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log(`✅ Release v${fullVersion} packaged successfully!`);
  console.log("═".repeat(50));

  console.log("\n📁 Artifacts created:");
  console.log(`   ${path.relative(config.rootPath, crxPath)}`);
  console.log(`   ${path.relative(config.rootPath, zipPath)}`);
  console.log(`   release/latest/josan-latest.crx`);
  console.log(`   release/latest/josan-latest.zip`);

  console.log("\n📋 Next steps:");
  console.log(
    `   1. Review release notes: release/${majorFolder}/release-notes-v${fullVersion}.md`,
  );
  console.log(
    `   2. Commit changes: git add -A && git commit -m "Release v${fullVersion}"`,
  );
  console.log(
    `   3. Create tag: git tag -a v${fullVersion} -m "Release v${fullVersion}"`,
  );
  console.log(`   4. Push: git push && git push origin v${fullVersion}`);
  console.log(`   5. Create GitHub Release with notes`);
  if (!prerelease) {
    console.log(`   6. Upload ZIP to Chrome Web Store`);
  }
  console.log("");
}

// CLI Entry Point
const args = process.argv.slice(2);
const targetVersion = args[0];

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
JoSan Release Packager

Usage:
  npm run release              Package current version from manifest.json
  npm run release <version>    Package specific version

Examples:
  npm run release              # Uses version from manifest.json
  npm run release 2.2.0        # Stable release
  npm run release 2.3.0-beta.1 # Beta release
  npm run release 3.0.0-rc.1   # Release candidate

Output:
  release/vX/josan-vX.Y.Z.crx     Signed extension package
  release/vX/josan-vX.Y.Z.zip     Chrome Web Store upload
  release/latest/josan-latest.*   Latest stable copies
`);
  process.exit(0);
}

release(targetVersion).catch((error) => {
  console.error("\n❌ Release failed:", error.message);
  process.exit(1);
});
