import * as vscode from "vscode";
import { convertSvgToJsx } from "../converter/convert";

export class SvgPasteProvider implements vscode.DocumentPasteEditProvider {
  // Identifies our edit: in the paste widget, in settings, and in "Paste As...".
  static readonly kind = vscode.DocumentDropOrPasteEditKind.Empty.append(
    "jsx",
    "svg",
  );

  constructor(private readonly log: vscode.LogOutputChannel) {}

  async provideDocumentPasteEdits(
    _document: vscode.TextDocument,
    _ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    _context: vscode.DocumentPasteEditContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    const text = await dataTransfer.get("text/plain")?.asString();
    if (!text || token.isCancellationRequested) {
      return undefined; // nothing to do: VS Code pastes normally
    }

    let jsx: string | null;
    try {
      // One tab per level: VS Code converts it to the file's indentation
      // and lines the pasted block up with the current line.
      jsx = convertSvgToJsx(text, { indent: "\t" });
    } catch (error) {
      // A bug in our converter must never cost the user their paste.
      this.log.error(
        "Conversion failed, so the original text was pasted.",
        error,
      );
      return undefined;
    }

    if (jsx === null) {
      return undefined; // not SVG: VS Code pastes normally
    }

    return [
      new vscode.DocumentPasteEdit(
        jsx,
        "Insert SVG as JSX",
        SvgPasteProvider.kind,
      ),
    ];
  }
}
