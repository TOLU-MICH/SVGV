import { parseXml, ParseError, type ElementNode, type XmlNode } from "./parser";

// Bigger pastes are left alone: our time budget for conversion.
const MAX_LENGTH = 200_000;

// Real SVG attributes are always quoted strings, so "={" or "{..." means JSX.
const JSX_SYNTAX = /=\s*\{|\{\s*\.\.\./;

export type Detection =
  | { kind: "svg"; svgs: ElementNode[] } // convert these
  | { kind: "invalid"; reason: string } // starts like SVG but can't be converted: tell the user
  | { kind: "other" }; // not SVG: paste normally and say nothing

const OTHER: Detection = { kind: "other" };

export function detectSvg(text: string): Detection {
  const trimmed = text.trim();

  // Layer 1: quick string checks. Almost every normal paste stops here.
  if (!trimmed.startsWith("<") || !trimmed.includes("<svg")) {
    return OTHER;
  }

  // Only text that *starts* like an SVG file is worth a warning when it fails.
  const looksLikeSvg = /^<(svg[\s>/]|\?xml|!DOCTYPE svg)/i.test(trimmed);

  if (trimmed.length > MAX_LENGTH) {
    return looksLikeSvg
      ? { kind: "invalid", reason: "it is larger than 200 KB" }
      : OTHER;
  }

  // Layer 2: parse. Our strict parser throws on anything that isn't clean XML.
  let nodes: XmlNode[];
  try {
    nodes = parseXml(trimmed);
  } catch (error) {
    if (!(error instanceof ParseError)) {
      throw error; // a real bug: let it surface instead of hiding it
    }
    // JSX copied from another component fails too, but that's expected: stay quiet.
    if (looksLikeSvg && !JSX_SYNTAX.test(trimmed)) {
      return { kind: "invalid", reason: error.message };
    }
    return OTHER;
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
      return OTHER;
    }
  }

  return svgs.length > 0 ? { kind: "svg", svgs } : OTHER;
}

/**
 * Returns the top-level <svg> elements if the text is purely SVG markup,
 * or null if it should be pasted unchanged.
 */
export function findSvgElements(text: string): ElementNode[] | null {
  const detection = detectSvg(text);
  return detection.kind === "svg" ? detection.svgs : null;
}
