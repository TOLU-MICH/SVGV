import { findSvgElements } from "./detect";
import { printJsx, type PrintOptions } from "./print";

/**
 * Converts clipboard text to JSX, or returns null if the text is not SVG
 * (meaning: paste it unchanged).
 */
export function convertSvgToJsx(
  text: string,
  options?: PrintOptions,
): string | null {
  const svgs = findSvgElements(text);
  return svgs ? printJsx(svgs, options) : null;
}
