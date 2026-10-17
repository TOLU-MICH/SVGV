const RENAMED = new Map<string, string>([
  ["class", "className"],
  ["for", "htmlFor"],
]);

export function toJsxAttributeName(name: string): string {
  const renamed = RENAMED.get(name);
  if (renamed) {
    return renamed;
  }

  // React keeps these hyphenated.
  if (name.startsWith("data-") || name.startsWith("aria-")) {
    return name;
  }

  // Remove each "-" or ":" and capitalize the letter after it.
  return name.replace(/[-:]([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}
