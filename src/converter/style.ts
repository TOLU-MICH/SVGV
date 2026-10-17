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

export function parseStyle(css: string): StyleObject {
  const style: StyleObject = {};

  for (const declaration of css.split(";")) {
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
