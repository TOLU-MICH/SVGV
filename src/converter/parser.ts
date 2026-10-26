// A small, strict XML parser for SVG markup.
// "Strict" is deliberate: anything unexpected throws a ParseError,
// and the caller then pastes the clipboard text unchanged.

export interface Attribute {
  name: string;
  value: string; // raw text between the quotes, entities like &amp; kept as-is
}

export interface ElementNode {
  type: "element";
  name: string;
  attributes: Attribute[];
  children: XmlNode[];
}

export interface TextNode {
  type: "text";
  value: string;
}

export interface CommentNode {
  type: "comment";
  value: string;
}

export interface CDataNode {
  type: "cdata";
  value: string;
}

// <?xml ...?> and <!DOCTYPE ...>, kept as raw text.
export interface DeclarationNode {
  type: "declaration";
  value: string;
}

export type XmlNode =
  | ElementNode
  | TextNode
  | CommentNode
  | CDataNode
  | DeclarationNode;

export class ParseError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(`${message} (at position ${position})`);
    this.name = "ParseError";
  }
}

export function parseXml(source: string): XmlNode[] {
  return new Parser(source).parseDocument();
}

// Element and attribute names: "svg", "stroke-width", "xlink:href", "data-name".
// The "y" (sticky) flag makes the regex match only at lastIndex, not anywhere after it.
const NAME = /[A-Za-z_][\w.:-]*/y;

class Parser {
  private pos = 0;

  constructor(private readonly src: string) {}

  parseDocument(): XmlNode[] {
    return this.parseNodes(null);
  }

  // Reads nodes until the closing tag of `parentName`,
  // or until the end of the input when parentName is null (the top level).
  private parseNodes(parentName: string | null): XmlNode[] {
    const nodes: XmlNode[] = [];

    while (this.pos < this.src.length) {
      if (this.startsWith("</")) {
        if (parentName === null) {
          throw this.error("Closing tag without a matching opening tag");
        }
        this.parseClosingTag(parentName);
        return nodes;
      }

      if (this.startsWith("<!--")) {
        nodes.push(this.parseComment());
      } else if (this.startsWith("<![CDATA[")) {
        nodes.push(this.parseCData());
      } else if (this.startsWith("<?") || this.startsWith("<!")) {
        nodes.push(this.parseDeclaration());
      } else if (this.startsWith("<")) {
        nodes.push(this.parseElement());
      } else {
        nodes.push(this.parseText());
      }
    }

    if (parentName !== null) {
      throw this.error(`Missing closing tag for <${parentName}>`);
    }
    return nodes;
  }

  private parseElement(): ElementNode {
    this.pos++; // skip "<"
    const name = this.readName();
    const attributes: Attribute[] = [];

    while (true) {
      const hadSpace = this.skipWhitespace();

      if (this.startsWith("/>")) {
        this.pos += 2;
        return { type: "element", name, attributes, children: [] };
      }

      if (this.startsWith(">")) {
        this.pos++;
        const children = this.parseNodes(name);
        return { type: "element", name, attributes, children };
      }

      // Attributes must be separated from the name and from each other by whitespace.
      if (!hadSpace) {
        throw this.error(
          `Unexpected character "${this.src[this.pos] ?? "end of input"}" in <${name}>`,
        );
      }
      attributes.push(this.parseAttribute(attributes));
    }
  }

  private parseAttribute(existing: Attribute[]): Attribute {
    const name = this.readName();
    if (existing.some((attribute) => attribute.name === name)) {
      throw this.error(`Duplicate attribute "${name}"`);
    }

    this.skipWhitespace();
    this.expect("=");
    this.skipWhitespace();

    const quote = this.src[this.pos];
    if (quote !== '"' && quote !== "'") {
      throw this.error(`Attribute "${name}" must be quoted`);
    }
    this.pos++;

    const value = this.readUntil(quote);
    if (value.includes("<")) {
      throw this.error(`Attribute "${name}" contains "<"`);
    }
    return { name, value };
  }

  private parseClosingTag(expectedName: string): void {
    this.pos += 2; // skip "</"
    const name = this.readName();
    this.skipWhitespace();
    this.expect(">");
    if (name !== expectedName) {
      throw this.error(`Expected </${expectedName}> but found </${name}>`);
    }
  }

  private parseComment(): CommentNode {
    this.pos += "<!--".length;
    return { type: "comment", value: this.readUntil("-->") };
  }

  private parseCData(): CDataNode {
    this.pos += "<![CDATA[".length;
    return { type: "cdata", value: this.readUntil("]]>") };
  }

  private parseDeclaration(): DeclarationNode {
    const start = this.pos;
    this.readUntil(">");
    return { type: "declaration", value: this.src.slice(start, this.pos) };
  }

  private parseText(): TextNode {
    const end = this.src.indexOf("<", this.pos);
    const stop = end === -1 ? this.src.length : end;
    const value = this.src.slice(this.pos, stop);
    this.pos = stop;
    return { type: "text", value };
  }

  // ---- small helpers ----

  private readName(): string {
    NAME.lastIndex = this.pos;
    const match = NAME.exec(this.src);
    if (!match) {
      throw this.error("Expected a name");
    }
    this.pos += match[0].length;
    return match[0];
  }

  // Returns the text up to `terminator` and moves past the terminator.
  private readUntil(terminator: string): string {
    const end = this.src.indexOf(terminator, this.pos);
    if (end === -1) {
      throw this.error(`Expected "${terminator}"`);
    }
    const value = this.src.slice(this.pos, end);
    this.pos = end + terminator.length;
    return value;
  }

  private skipWhitespace(): boolean {
    const start = this.pos;
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) {
      this.pos++;
    }
    return this.pos > start;
  }

  private expect(char: string): void {
    if (this.src[this.pos] !== char) {
      throw this.error(`Expected "${char}"`);
    }
    this.pos++;
  }

  private startsWith(text: string): boolean {
    return this.src.startsWith(text, this.pos);
  }

  private error(message: string): ParseError {
    return new ParseError(message, this.pos);
  }
}
