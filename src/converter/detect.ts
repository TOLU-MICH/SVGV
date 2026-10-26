import { parseXml, ParseError, type ElementNode, type XmlNode } from "./parser";

// Bigger pastes are left alone: our time budget for conversion.
const MAX_LENGTH = 200_000;

/**
 * Returns the top-level <svg> elements if the text is purely SVG markup,
 * or null if it should be pasted unchanged.
 */
export function findSvgElements(text: string): ElementNode[] | null {
  const trimmed = text.trim();

  // Layer 1: quick string checks. Almost every normal paste stops here.
  if (
    trimmed.length > MAX_LENGTH ||
    !trimmed.startsWith("<") ||
    !trimmed.endsWith(">") ||
    !trimmed.includes("<svg")
  ) {
    return null;
  }

  // Layer 2: parse. Our strict parser throws on anything that isn't clean XML,
  // including JSX like style={{...}} or {...props}.
  let nodes: XmlNode[];
  try {
    nodes = parseXml(trimmed);
  } catch (error) {
    if (error instanceof ParseError) {
      return null; // not valid SVG markup, so paste it unchanged
    }
    throw error; // a real bug: let it surface instead of hiding it
  }

  // Layer 3: only <svg> elements and harmless extras at the top level.
  const svgs: ElementNode[] = [];
  for (const node of nodes) {
    if (node.type === "element" && node.name === "svg") {
      svgs.push(node);
      continue;
    }

    const harmless =
      node.type === "comment" || // <!-- ... -->
      node.type === "declaration" || // <?xml ...?> and <!DOCTYPE ...>
      (node.type === "text" && node.value.trim() === ""); // whitespace between elements

    if (!harmless) {
      return null;
    }
  }

  return svgs.length > 0 ? svgs : null;
}
