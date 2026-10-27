import * as assert from "assert";
import * as vscode from "vscode";

export const ICON =
  '<svg viewBox="0 0 24 24"><path d="M0 0" stroke-width="2"/></svg>';

const SETTINGS = [
  "autoPasteEnabled",
  "includeJsFiles",
  "outputFormat",
  "language",
  "componentNaming",
];

/** Finds our extension by its package.json name and makes sure it is running. */
export async function activateExtension(): Promise<void> {
  const extension = vscode.extensions.all.find(
    (ext) => ext.packageJSON.name === "svg-v",
  );
  assert.ok(extension, "svg-v should be loaded in the test window");
  await extension.activate();
}

/** Opens a new, unsaved editor with the given language and content. */
export async function openEditor(
  language: string,
  content = "",
): Promise<vscode.TextEditor> {
  const document = await vscode.workspace.openTextDocument({
    language,
    content,
  });
  return vscode.window.showTextDocument(document);
}

/** Changes one svg-v setting in the test window's user settings. */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await vscode.workspace
    .getConfiguration("svg-v")
    .update(key, value, vscode.ConfigurationTarget.Global);
}

/** Puts every setting back to its default and closes all editors, so tests can't affect each other. */
export async function resetAll(): Promise<void> {
  for (const key of SETTINGS) {
    await setSetting(key, undefined);
  }
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}
