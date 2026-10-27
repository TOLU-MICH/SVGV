import * as vscode from "vscode";
import type { ElementNode } from "../converter/parser";
import { findSvgElements } from "../converter/detect";
import { printJsx } from "../converter/print";
import { inferComponentName } from "../converter/component";
import { autoPasteEnabledFor, readSettings, type Settings } from "../settings";
import { componentCode } from "./componentCode";

export class SvgPasteProvider implements vscode.DocumentPasteEditProvider {
  // Our two kinds of edit. They are siblings, so asking for one never returns the other.
  static readonly inlineKind = vscode.DocumentDropOrPasteEditKind.Empty.append(
    "jsx",
    "svg",
    "inline",
  );
  static readonly componentKind =
    vscode.DocumentDropOrPasteEditKind.Empty.append("jsx", "svg", "component");

  constructor(private readonly log: vscode.LogOutputChannel) {}

  async provideDocumentPasteEdits(
    document: vscode.TextDocument,
    ranges: readonly vscode.Range[],
    dataTransfer: vscode.DataTransfer,
    context: vscode.DocumentPasteEditContext,
    token: vscode.CancellationToken,
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    // A normal paste respects the settings. An explicit "Paste As..." always converts.
    const isNormalPaste =
      context.triggerKind === vscode.DocumentPasteTriggerKind.Automatic;
    if (isNormalPaste && !autoPasteEnabledFor(document)) {
      return undefined;
    }

    const text = await dataTransfer.get("text/plain")?.asString();
    if (!text || token.isCancellationRequested) {
      return undefined; // nothing to do: VS Code pastes normally
    }

    try {
      return this.createEdits(document, ranges[0].start, text);
    } catch (error) {
      // A bug in our converter must never cost the user their paste.
      this.log.error(
        "Conversion failed, so the original text was pasted.",
        error,
      );
      return undefined;
    }
  }

  private createEdits(
    document: vscode.TextDocument,
    at: vscode.Position,
    text: string,
  ): vscode.DocumentPasteEdit[] | undefined {
    const svgs = findSvgElements(text);
    if (svgs === null) {
      return undefined; // not SVG: VS Code pastes normally
    }

    // One tab per level: VS Code converts it to the file's indentation
    // and lines the pasted block up with the current line.
    const inline = new vscode.DocumentPasteEdit(
      printJsx(svgs, { indent: "\t" }),
      "Insert SVG as JSX",
      SvgPasteProvider.inlineKind,
    );

    // A component wraps exactly one SVG, so several SVGs only get the inline option.
    if (svgs.length !== 1) {
      return [inline];
    }

    const settings = readSettings(document);
    const component = this.createComponentEdit(document, svgs[0], settings, at);

    // VS Code applies the first edit and offers the rest in the paste widget.
    return settings.outputFormat === "component"
      ? [component, inline]
      : [inline, component];
  }

  private createComponentEdit(
    document: vscode.TextDocument,
    svg: ElementNode,
    settings: Settings,
    at: vscode.Position,
  ): vscode.DocumentPasteEdit {
    // A normal paste never interrupts the user with a prompt, so the name is always inferred.
    const code = componentCode(
      document,
      svg,
      inferComponentName(svg),
      settings,
      at,
    );
    const edit = new vscode.DocumentPasteEdit(
      code.text,
      "Insert SVG as component",
      SvgPasteProvider.componentKind,
    );

    if (code.importEdit) {
      // Applied together with the paste, so one undo removes both.
      edit.additionalEdit = new vscode.WorkspaceEdit();
      edit.additionalEdit.set(document.uri, [code.importEdit]);
    }
    return edit;
  }
}
