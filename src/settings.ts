import * as vscode from "vscode";

export const SETTINGS_SECTION = "svg-v";

/** Should a normal paste into this document convert SVG automatically? */
export function autoPasteEnabledFor(document: vscode.TextDocument): boolean {
  // Passing the document lets folder and language-specific settings apply.
  const settings = vscode.workspace.getConfiguration(
    SETTINGS_SECTION,
    document,
  );

  if (!settings.get<boolean>("autoPasteEnabled", true)) {
    return false;
  }
  if (document.languageId === "javascript") {
    return settings.get<boolean>("includeJsFiles", false);
  }
  return true;
}
