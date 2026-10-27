import * as vscode from "vscode";
import { SvgPasteProvider } from "./paste/svgPasteProvider";
import { pasteAsJsx } from "./commands/pasteAsJsx";
import { pasteAsComponent } from "./commands/pasteAsComponent";

// Where the paste provider runs. Whether it actually converts is decided by the settings.
const SUPPORTED_FILES: vscode.DocumentSelector = [
  { language: "typescriptreact" }, // .tsx
  { language: "javascriptreact" }, // .jsx
  { language: "javascript" }, // .js, only when svg-v.includeJsFiles is on
];

export function activate(context: vscode.ExtensionContext): void {
  const log = vscode.window.createOutputChannel("svgV", { log: true });

  context.subscriptions.push(
    log,
    vscode.languages.registerDocumentPasteEditProvider(
      SUPPORTED_FILES,
      new SvgPasteProvider(log),
      {
        providedPasteEditKinds: [
          SvgPasteProvider.inlineKind,
          SvgPasteProvider.componentKind,
        ],
        pasteMimeTypes: ["text/plain"],
      },
    ),
    vscode.commands.registerCommand("svg-v.pasteAsJsx", pasteAsJsx),
    vscode.commands.registerCommand("svg-v.pasteAsComponent", pasteAsComponent),
  );
}

export function deactivate(): void {}
