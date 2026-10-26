import * as vscode from "vscode";
import { SvgPasteProvider } from "./paste/svgPasteProvider";

// The file types where pasted SVG becomes JSX automatically.
const REACT_FILES: vscode.DocumentSelector = [
  { language: "typescriptreact" }, // .tsx
  { language: "javascriptreact" }, // .jsx
];

export function activate(context: vscode.ExtensionContext): void {
  const log = vscode.window.createOutputChannel("SVG to JSX", { log: true });

  context.subscriptions.push(
    log,
    vscode.languages.registerDocumentPasteEditProvider(
      REACT_FILES,
      new SvgPasteProvider(log),
      {
        providedPasteEditKinds: [SvgPasteProvider.kind],
        pasteMimeTypes: ["text/plain"],
      },
    ),
  );
}

export function deactivate(): void {}
