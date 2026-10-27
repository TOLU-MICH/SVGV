import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { convertSvgToJsx } from "./convert";
import { findSvgElements } from "./detect";
import { printComponent } from "./component";

// Real-world SVGs live in ./fixtures. Every .svg file there is tested automatically.
const fixturesDir = new URL("./fixtures/", import.meta.url);
const fixtures = readdirSync(fixturesDir).filter((file) =>
  file.endsWith(".svg"),
);

// An empty folder would silently run zero tests, so make that a failure.
it("has fixtures to test", () => {
  expect(fixtures.length).toBeGreaterThan(0);
});

describe.each(fixtures)("%s", (file) => {
  const text = readFileSync(new URL(file, fixturesDir), "utf8");
  const snapshot = (kind: string) =>
    `./fixtures/__snapshots__/${file.replace(/\.svg$/, "")}.${kind}.snap`;

  it("converts to inline JSX", async () => {
    await expect(convertSvgToJsx(text)).toMatchFileSnapshot(snapshot("inline"));
  });

  it("converts to a typed component", async () => {
    const svgs = findSvgElements(text);
    if (svgs?.length !== 1) {
      throw new Error("Each fixture must contain exactly one SVG");
    }
    await expect(
      printComponent(svgs[0], { name: "Icon", typescript: true }),
    ).toMatchFileSnapshot(snapshot("component"));
  });
});
