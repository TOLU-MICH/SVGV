import * as vscode from "vscode";
import { SvgPasteProvider } from "../paste/svgPasteProvider";
import { readClipboardSvg } from "./clipboardSvg";

export async function pasteAsJsx(): Promise<void> {
  // Check first, so the user gets a clear message instead of VS Code's generic one.
  if ((await readClipboardSvg()) === null) {
    return;
  }

  // Reuse VS Code's own "Paste As..." with our edit kind: same conversion,
  // same indentation handling and same single undo step as a normal paste.
  await vscode.commands.executeCommand("editor.action.pasteAs", {
    kind: SvgPasteProvider.inlineKind.value,
  });
}
