import * as vscode from "vscode";
import type { ElementNode } from "../converter/parser";
import { detectSvg } from "../converter/detect";

/** Reads SVG from the clipboard, or shows a warning and returns null. */
export async function readClipboardSvg(): Promise<ElementNode[] | null> {
  const detection = detectSvg(await vscode.env.clipboard.readText());

  switch (detection.kind) {
    case "svg":
      return detection.svgs;
    case "invalid":
      void vscode.window.showWarningMessage(
        `The SVG on the clipboard couldn't be converted: ${detection.reason}`,
      );
      return null;
    case "other":
      void vscode.window.showWarningMessage(
        "The clipboard does not contain SVG markup.",
      );
      return null;
  }
}
