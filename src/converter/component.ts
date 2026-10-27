import type { ElementNode, XmlNode } from "./parser";
import { printJsx } from "./print";

export interface ComponentOptions {
  name: string;
  typescript: boolean;
  indent?: string;
}

const FALLBACK_NAME = "SvgIcon";

// React treats <lowercase> tags as HTML elements, so components must start with a capital letter.
const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;

export function isValidComponentName(name: string): boolean {
  return COMPONENT_NAME.test(name);
}

/** "arrow-left", "Arrow Left" and "arrow_left" all become "ArrowLeft". */
export function toComponentName(text: string): string | null {
  const words = text.split(/[^A-Za-z0-9]+/).filter((word) => word !== "");
  const name = words
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
  if (name === "") {
    return null;
  }
  // Names can't start with a digit: "24px" becomes "Icon24px".
  return /^\d/.test(name) ? `Icon${name}` : name;
}

/** Picks a name from the SVG's <title> or id, or falls back to "SvgIcon". */
export function inferComponentName(svg: ElementNode): string {
  const title = svg.children.find((child) => isElement(child, "title"));
  const titleText = title?.type === "element" ? textOf(title) : "";
  const id =
    svg.attributes.find((attribute) => attribute.name === "id")?.value ?? "";

  for (const candidate of [titleText, id]) {
    const name = toComponentName(candidate);
    if (name !== null) {
      return name;
    }
  }
  return FALLBACK_NAME;
}

export function printComponent(
  svg: ElementNode,
  options: ComponentOptions,
): string {
  if (!isValidComponentName(options.name)) {
    throw new Error(`Invalid component name: "${options.name}"`);
  }

  const indent = options.indent ?? "  ";
  // {...props} goes last, so whatever the caller passes overrides the SVG's own values.
  const jsx = printJsx([svg], { indent, rootAttributes: ["{...props}"] });
  const parameter = options.typescript
    ? "props: SVGProps<SVGSVGElement>"
    : "props";

  return [
    `export function ${options.name}(${parameter}) {`,
    `${indent}return (`,
    ...jsx.split("\n").map((line) => indent + indent + line),
    `${indent});`,
    "}",
  ].join("\n");
}

function isElement(node: XmlNode, name: string): boolean {
  return node.type === "element" && node.name === name;
}

function textOf(element: ElementNode): string {
  return element.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("");
}
