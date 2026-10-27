import * as vscode from "vscode";

export const SETTINGS_SECTION = "svg-v";

export interface Settings {
  autoPasteEnabled: boolean;
  includeJsFiles: boolean;
  outputFormat: "inline" | "component";
  language: "infer" | "js" | "ts";
  componentNaming: "prompt" | "infer";
}

/** Reads the settings that apply to this document (user, workspace and folder levels). */
export function readSettings(document: vscode.TextDocument): Settings {
  const settings = vscode.workspace.getConfiguration(
    SETTINGS_SECTION,
    document,
  );

  // Users can type anything into settings.json, so every value is checked
  // and an unknown value falls back to the default.
  const language = settings.get<string>("language");
  return {
    autoPasteEnabled: settings.get<boolean>("autoPasteEnabled") !== false,
    includeJsFiles: settings.get<boolean>("includeJsFiles") === true,
    outputFormat:
      settings.get<string>("outputFormat") === "component"
        ? "component"
        : "inline",
    language: language === "js" || language === "ts" ? language : "infer",
    componentNaming:
      settings.get<string>("componentNaming") === "infer" ? "infer" : "prompt",
  };
}

/** Should a normal paste into this document convert SVG automatically? */
export function autoPasteEnabledFor(document: vscode.TextDocument): boolean {
  const settings = readSettings(document);
  if (!settings.autoPasteEnabled) {
    return false;
  }
  if (document.languageId === "javascript") {
    return settings.includeJsFiles;
  }
  return true;
}

/** Should component output be typed? */
export function useTypeScript(
  document: vscode.TextDocument,
  settings: Settings,
): boolean {
  if (settings.language !== "infer") {
    return settings.language === "ts";
  }
  return document.languageId === "typescriptreact";
}
