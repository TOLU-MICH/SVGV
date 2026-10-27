import { defineConfig } from "@vscode/test-cli";

const shared = {
  files: "out/test/**/*.test.js",
  // Only our extension runs in the test window, so other extensions can't interfere.
  launchArgs: ["--disable-extensions"],
  mocha: { timeout: 20_000 },
};

export default defineConfig([
  // The newest VS Code: what most users have.
  { ...shared, label: "stable", version: "stable" },
  // The oldest version package.json says we support: proves that promise is true.
  { ...shared, label: "minimum", version: "1.97.0" },
]);
