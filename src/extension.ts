import * as vscode from "vscode";
import { SvgPasteProvider } from "./paste/svgPasteProvider";
import { pasteAsJsx } from "./commands/pasteAsJsx";

// Where the paste provider runs. Whether it actually converts is decided by the settings.
const SUPPORTED_FILES: vscode.DocumentSelector = [
  { language: "typescriptreact" }, // .tsx
  { language: "javascriptreact" }, // .jsx
  { language: "javascript" }, // .js, only when svg-v.includeJsFiles is on
];

export function activate(context: vscode.ExtensionContext): void {
  const log = vscode.window.createOutputChannel("SVG to JSX", { log: true });

  context.subscriptions.push(
    log,
    vscode.languages.registerDocumentPasteEditProvider(
      SUPPORTED_FILES,
      new SvgPasteProvider(log),
      {
        providedPasteEditKinds: [SvgPasteProvider.kind],
        pasteMimeTypes: ["text/plain"],
      },
    ),
    vscode.commands.registerCommand("svg-v.pasteAsJsx", pasteAsJsx),
  );
}

export function deactivate(): void {}
