
import { Lexer, Token } from "./lexer";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// First sets:
// {
//   expression: { NUMBER: 0, MINUS: 0, LPAREN: 0, FUNCTION_NAME: 0 },
//   "expression'": { PLUS: 0, MINUS: 1, EPS: 2 },
//   term: { NUMBER: 0, MINUS: 0, LPAREN: 0, FUNCTION_NAME: 0 },
//   "term'": { MUL: 0, EPS: 1 },
//   factor: { NUMBER: 0, MINUS: 1, LPAREN: 2, FUNCTION_NAME: 3 },
//   arguments: { EPS: 1, NUMBER: 0, MINUS: 0, LPAREN: 0, FUNCTION_NAME: 0 },
//   varargs: { COMMA: 0, EPS: 1 }
// }

export class Parser {
  private tokens: Token[];
  private curTokenIndex = 0;
  private get curToken(): Token {
    return this.tokens[this.curTokenIndex];
  }

  private startParse(input: string): any {
    this.tokens = new Lexer().tokenize(input);
    return this["parse$expression"]();
  }

  public static parse(input: string): any {
    return new Parser().startParse(input);
  }

  private nextToken(): Token {
    return this.tokens[this.curTokenIndex++];
  }

  private expectOneOf(names: string[]): void {
    if (!names.includes(this.curToken[0])) {
      throw new ParseError(`Expected ${names.length === 1 ? "" : "one of "}${names.join(", ")} but got ${this.curToken[0]}${this.curToken[0] === "EOF" ? "" : " (" + this.curToken[1] + ")"})`);
    }
  }

  private leaveOnly(obj: Record<string, any>, names: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const name of names) {
      result[name] = obj[name];
    }
    return result;
  }


  private readToken(type: string): string {
    this.expectOneOf([type]);
    const token = this.curToken[1];
    this.nextToken();
    return token;
  }

  // Actions
  // Actions for expression

  // Actions for expression'

  // Actions for term

  // Actions for term'

  // Actions for factor

  // Actions for arguments

  // Actions for varargs

  // Tokens
  private ["parse$expression"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$term"]();
        this["parse$expression'"]();
        return parsedResults;
    }
  }

  private ["parse$expression'"](): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "PLUS":
        this.readToken("PLUS");
        this["parse$term"]();
        this["parse$expression'"]();
        return parsedResults;
      // Rule 1
      case "MINUS":
        this.readToken("MINUS");
        this["parse$term"]();
        this["parse$expression'"]();
        return parsedResults;
      // Rule 2
      default:
        return parsedResults;
    }
  }

  private ["parse$term"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$factor"]();
        this["parse$term'"]();
        return parsedResults;
    }
  }

  private ["parse$term'"](): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "MUL":
        this.readToken("MUL");
        this["parse$factor"]();
        this["parse$term'"]();
        return parsedResults;
      // Rule 1
      default:
        return parsedResults;
    }
  }

  private ["parse$factor"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
        this.readToken("NUMBER");
        return parsedResults;
      // Rule 1
      case "MINUS":
        this.readToken("MINUS");
        this["parse$factor"]();
        return parsedResults;
      // Rule 2
      case "LPAREN":
        this.readToken("LPAREN");
        this["parse$expression"]();
        this.readToken("RPAREN");
        return parsedResults;
      // Rule 3
      case "FUNCTION_NAME":
        this.readToken("FUNCTION_NAME");
        this.readToken("LPAREN");
        this["parse$arguments"]();
        this.readToken("RPAREN");
        return parsedResults;
    }
  }

  private ["parse$arguments"](): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$expression"]();
        this["parse$varargs"]();
        return parsedResults;
      // Rule 1
      default:
        return parsedResults;
    }
  }

  private ["parse$varargs"](): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "COMMA":
        this.readToken("COMMA");
        this["parse$expression"]();
        this["parse$varargs"]();
        return parsedResults;
      // Rule 1
      default:
        return parsedResults;
    }
  }

  // Arguments

}
