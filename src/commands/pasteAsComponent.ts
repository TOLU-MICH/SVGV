import * as vscode from "vscode";
import {
  inferComponentName,
  isNameUsed,
  isValidComponentName,
  uniqueComponentName,
} from "../converter/component";
import { componentCode } from "../paste/componentCode";
import { readSettings } from "../settings";
import { readClipboardSvg } from "./clipboardSvg";

export async function pasteAsComponent(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const svgs = await readClipboardSvg();
  if (svgs === null) {
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
  const source = editor.document.getText();
  let name = uniqueComponentName(inferComponentName(svg), source);

  if (settings.componentNaming === "prompt") {
    const answer = await vscode.window.showInputBox({
      title: "Paste as Component",
      prompt: "Component name",
      value: name,
      validateInput: (value) => {
        if (!isValidComponentName(value)) {
          return "Start with a capital letter, then use only letters and digits."; // blocks Enter
        }
        if (isNameUsed(value, source)) {
          // A warning still lets the user press Enter: they may be replacing the old one.
          return {
            message: `${value} is already used in this file.`,
            severity: vscode.InputBoxValidationSeverity.Warning,
          };
        }
        return undefined;
      },
    });
    if (answer === undefined) {
      return; // Escape cancels the whole command
    }
    name = answer;
  }

  const code = componentCode(
    editor.document,
    svg,
    name,
    settings,
    editor.selection.start,
  );

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
