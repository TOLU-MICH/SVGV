export type StyleObject = Record<string, string | number>;

// Matches "1", "0.5", ".5", "-2", but not "12px" or "1e3".
const PLAIN_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

// React adds "px" to numbers for any property not listed here.
const UNITLESS = new Set([
  "animationIterationCount",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
]);

function camelCase(name: string): string {
  return name.replace(/-([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

export function toJsxStyleProperty(property: string): string {
  // Custom properties are case-sensitive.
  if (property.startsWith("--")) {
    return property;
  }

  const name = property.toLowerCase();

  // React expects msTransform, not MsTransform.
  if (name.startsWith("-ms-")) {
    return camelCase(name.slice(1));
  }

  return camelCase(name);
}

// Splits on ";" except inside parentheses or quotes, or after a "\".
function splitDeclarations(css: string): string[] {
  const declarations: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (const char of css) {
    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (char === ";" && depth === 0) {
      declarations.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  declarations.push(current);
  return declarations;
}

export function parseStyle(css: string): StyleObject {
  const style: StyleObject = {};

  for (const declaration of splitDeclarations(css)) {
    const colon = declaration.indexOf(":");
    if (colon === -1) {
      continue;
    }

    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) {
      continue;
    }

    const key = toJsxStyleProperty(property);
    // React never adds "px" to 0.
    const keepAsNumber =
      PLAIN_NUMBER.test(value) && (UNITLESS.has(key) || Number(value) === 0);
    style[key] = keepAsNumber ? Number(value) : value;
  }

  return style;
}
