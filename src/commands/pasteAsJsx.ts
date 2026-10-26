import * as vscode from "vscode";
import { findSvgElements } from "../converter/detect";
import { SvgPasteProvider } from "../paste/svgPasteProvider";

export async function pasteAsJsx(): Promise<void> {
  // Check first, so the user gets a clear message instead of VS Code's generic one.
  const text = await vscode.env.clipboard.readText();
  if (findSvgElements(text) === null) {
    void vscode.window.showWarningMessage(
      "The clipboard does not contain SVG markup.",
    );
    return;
  }

  // Reuse VS Code's own "Paste As..." with our edit kind: same conversion,
  // same indentation handling and same single undo step as a normal paste.
  await vscode.commands.executeCommand("editor.action.pasteAs", {
    kind: SvgPasteProvider.kind.value,
  });
}
