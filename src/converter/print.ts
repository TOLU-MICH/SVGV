import type { Attribute, ElementNode, XmlNode } from "./parser";
import { toJsxAttributeName } from "./attributes";
import { parseStyle, type StyleObject } from "./style";

export interface PrintOptions {
  indent?: string; // one level of indentation, e.g. "  " or "\t"
  printWidth?: number; // opening tags longer than this get one attribute per line
}

interface Context {
  indent: string;
  //TODO: make this dynamic like it is on prettier
  printWidth: number;
}

export function printJsx(
  svgs: ElementNode[],
  options: PrintOptions = {},
): string {
  const context: Context = {
    indent: options.indent ?? "  ",
    printWidth: options.printWidth ?? 80,
  };

  if (svgs.length === 1) {
    return printElement(svgs[0], 0, context).join("\n");
  }

  // Sibling elements are only valid JSX when wrapped in a fragment.
  const lines = svgs.flatMap((svg) => printElement(svg, 1, context));
  return ["<>", ...lines, "</>"].join("\n");
}

// ---- elements ----

// Returns the element as an array of lines. Joining with "\n" happens once, at the very end.
function printElement(
  element: ElementNode,
  depth: number,
  context: Context,
): string[] {
  const pad = context.indent.repeat(depth);

  // Text inside an element (like <title> or <text>) is whitespace-sensitive in JSX,
  // so the whole element stays on one line exactly as written.
  if (hasTextContent(element)) {
    return [pad + printInline(element)];
  }

  // Comments and whitespace-only text are dropped, so only child elements remain.
  const children = element.children.filter((child) => child.type === "element");
  const selfClosing = children.length === 0;
  const openTag = printOpenTag(element, selfClosing, pad, context);

  if (selfClosing) {
    return openTag;
  }

  const inner = children.flatMap((child) =>
    printElement(child, depth + 1, context),
  );
  return [...openTag, ...inner, `${pad}</${element.name}>`];
}

function printOpenTag(
  element: ElementNode,
  selfClosing: boolean,
  pad: string,
  context: Context,
): string[] {
  const attributes = printAttributes(element.attributes);
  const end = selfClosing ? " />" : ">";

  const oneLine = `${pad}<${element.name}${attributes.map((a) => " " + a).join("")}${end}`;
  if (oneLine.length <= context.printWidth || attributes.length === 0) {
    return [oneLine];
  }

  // Too long: one attribute per line, like Prettier does.
  return [
    `${pad}<${element.name}`,
    ...attributes.map((attribute) => pad + context.indent + attribute),
    pad + end.trim(),
  ];
}

function hasTextContent(element: ElementNode): boolean {
  return element.children.some(
    (child) =>
      (child.type === "text" && child.value.trim() !== "") ||
      child.type === "cdata",
  );
}

// Prints a whole subtree on a single line, keeping text exactly where it was.
function printInline(node: XmlNode): string {
  switch (node.type) {
    case "element": {
      const attributes = printAttributes(node.attributes)
        .map((a) => " " + a)
        .join("");
      if (node.children.length === 0) {
        return `<${node.name}${attributes} />`;
      }
      const children = node.children.map(printInline).join("");
      return `<${node.name}${attributes}>${children}</${node.name}>`;
    }
    case "text":
      return escapeJsxText(node.value);
    case "cdata":
      return `{\`${escapeTemplateLiteral(node.value)}\`}`;
    case "comment":
    case "declaration":
      return ""; // removed, as the FRD requires
  }
}

// ---- attributes ----

function printAttributes(attributes: Attribute[]): string[] {
  const printed: string[] = [];
  for (const attribute of attributes) {
    const result = printAttribute(attribute);
    if (result !== null) {
      printed.push(result);
    }
  }
  return printed;
}

function printAttribute({ name, value }: Attribute): string | null {
  const jsxName = toJsxAttributeName(name);

  if (jsxName === "style") {
    const style = parseStyle(decodeEntities(value));
    // style="" or a style with no valid declarations is simply dropped.
    return Object.keys(style).length > 0
      ? `style={${printStyleObject(style)}}`
      : null;
  }

  // JSX string attributes understand HTML entities, so &quot; is the safe way to write a quote.
  return `${jsxName}="${value.replace(/"/g, "&quot;")}"`;
}

function printStyleObject(style: StyleObject): string {
  const entries = Object.entries(style).map(([key, value]) => {
    const printedKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quoteString(key);
    const printedValue =
      typeof value === "number" ? String(value) : quoteString(value);
    return `${printedKey}: ${printedValue}`;
  });
  return `{ ${entries.join(", ")} }`;
}

// ---- escaping ----

// A JavaScript string in single quotes.
function quoteString(text: string): string {
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return `'${escaped}'`;
}

// Braces start JSX expressions and ">" is not allowed in JSX text, so write them as entities.
function escapeJsxText(text: string): string {
  return text
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/>/g, "&gt;");
}

function escapeTemplateLiteral(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

const NAMED_ENTITIES = new Map<string, string>([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
]);

// Entities are decoded by JSX in strings and text, but NOT inside a JavaScript
// style object, so style values have to be decoded by us.
function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (match, entity: string) => {
      const lower = entity.toLowerCase();
      if (lower.startsWith("#")) {
        const isHex = lower.startsWith("#x");
        const codePoint = parseInt(lower.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        // Numbers beyond the last Unicode character are left as written.
        return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
      }
      return NAMED_ENTITIES.get(lower) ?? match;
    },
  );
}
