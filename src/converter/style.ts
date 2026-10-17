export type StyleObject = Record<string, string | number>;

// A plain number: "1", "0.5", ".5", "-2". Not "12px" or "1e3".
const PLAIN_NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

function camelCase(name: string): string {
  return name.replace(/-([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

export function toJsxStyleProperty(property: string): string {
  // Custom properties are case-sensitive and stay as-is.
  if (property.startsWith("--")) {
    return property;
  }

  const name = property.toLowerCase();

  // React spells this one prefix in lowercase: msTransform, not MsTransform.
  if (name.startsWith("-ms-")) {
    return camelCase(name.slice(1));
  }

  // "-webkit-transform" → "WebkitTransform" falls out naturally,
  // because the leading "-w" becomes "W".
  return camelCase(name);
}

// Splits "a: 1; b: 2" into declarations, but ignores semicolons
// inside parentheses or quotes, e.g. url(data:image/png;base64,...).
function splitDeclarations(css: string): string[] {
  const declarations: string[] = [];
  let current = "";
  let depth = 0; // how many "(" we are currently inside
  let quote: string | null = null; // the quote we are inside, if any

  for (const char of css) {
    if (quote) {
      if (char === quote) {
        quote = null; // closing quote
      }
    } else if (char === '"' || char === "'") {
      quote = char; // opening quote
    } else if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (char === ";" && depth === 0) {
      declarations.push(current); // a real separator
      current = "";
      continue; // don't keep the ";" itself
    }
    current += char;
  }

  declarations.push(current); // the last declaration has no ";" after it
  return declarations;
}

export function parseStyle(css: string): StyleObject {
  const style: StyleObject = {};

  for (const declaration of splitDeclarations(css)) {
    const colon = declaration.indexOf(":");
    if (colon === -1) {
      continue; // no colon, so not a real declaration
    }

    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) {
      continue;
    }

    style[toJsxStyleProperty(property)] = PLAIN_NUMBER.test(value)
      ? Number(value)
      : value;
  }

  return style;
}
