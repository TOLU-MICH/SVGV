import * as vscode from "vscode";
import { findSvgElements } from "../converter/detect";
import {
  inferComponentName,
  isValidComponentName,
} from "../converter/component";
import { componentCode } from "../paste/componentCode";
import { readSettings } from "../settings";

export async function pasteAsComponent(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const svgs = findSvgElements(await vscode.env.clipboard.readText());
  if (svgs === null) {
    void vscode.window.showWarningMessage(
      "The clipboard does not contain SVG markup.",
    );
    return;
  }
  if (svgs.length > 1) {
    void vscode.window.showWarningMessage(
      `Paste as Component works with one SVG at a time, but the clipboard contains ${svgs.length}.`,
    );
    return;
  }

  const svg = svgs[0];
  const settings = readSettings(editor.document);
  let name = inferComponentName(svg);

  if (settings.componentNaming === "prompt") {
    const answer = await vscode.window.showInputBox({
      title: "Paste as Component",
      prompt: "Component name",
      value: name,
      validateInput: (value) =>
        isValidComponentName(value)
          ? undefined
          : "Start with a capital letter, then use only letters and digits.",
    });
    if (answer === undefined) {
      return; // Escape cancels the whole command
    }
    name = answer;
  }

  const code = componentCode(editor.document, svg, name, settings);

  // One WorkspaceEdit = one undo step. The snippet edit gets the same
  // indentation handling as a paste; appendText escapes "$" and "}" for us.
  const edits: Array<vscode.TextEdit | vscode.SnippetTextEdit> = [
    new vscode.SnippetTextEdit(
      editor.selection,
      new vscode.SnippetString().appendText(code.text),
    ),
  ];
  if (code.importEdit) {
    edits.push(code.importEdit);
  }

  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(editor.document.uri, edits);
  await vscode.workspace.applyEdit(workspaceEdit);
}
