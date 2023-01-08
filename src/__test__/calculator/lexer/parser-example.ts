import { Lexer, Token } from "./lexer";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// First sets:
// {
//   expression: Set(4) { 'NUMBER', 'MINUS', 'LPAREN', 'FUNCTION_NAME' },
//   "expression'": Set(3) { 'PLUS', 'MINUS', 'EPS' },
//   term: Set(4) { 'NUMBER', 'MINUS', 'LPAREN', 'FUNCTION_NAME' },
//   "term'": Set(2) { 'MUL', 'EPS' },
//   factor: Set(4) { 'NUMBER', 'MINUS', 'LPAREN', 'FUNCTION_NAME' },
//   arguments: Set(5) { 'NUMBER', 'MINUS', 'LPAREN', 'FUNCTION_NAME', 'EPS' },
//   varargs: Set(2) { 'COMMA', 'EPS' }
// }

export class Parser {
  private tokens: Token[];
  private curTokenIndex = 0;
  private get curToken(): Token {
    return this.tokens[this.curTokenIndex];
  }
  private start = "start";
  public parse(input: string): any {
    this.tokens = new Lexer().tokenize(input);
  }

  private nextToken(): Token {
    return this.tokens[this.curTokenIndex++];
  }

  private expectOneOf(names: string[]): void {
    if (!names.includes(this.curToken[0])) {
      throw new ParseError(`Expected one of ${names.join(", ")} but got ${this.curToken[0]} (${this.curToken[1]})`);
    }
  }

  private ["parse$expression"](): any {
    this.expectOneOf(["NUMBER", "MINUS", "LPAREN", "FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$term"]();
        this["parse$expression'"]();
        break;
    }
  }
  private ["parse$expression'"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      case "PLUS":
        this.nextToken();
        this["parse$term"]();
        this["parse$expression'"]();
        break;
      case "MINUS":
        this.nextToken();
        this["parse$term"]();
        this["parse$expression'"]();
        break;
      default: // EPS
        break;
    }
  }
  private ["parse$term"](): any {
    this.expectOneOf(["NUMBER", "MINUS", "LPAREN", "FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$factor"]();
        this["parse$term'"]();
        break;
    }
  }
  private ["parse$term'"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      case "MUL":
        this.nextToken();
        this["parse$factor"]();
        this["parse$term'"]();
        break;
      default: // EPS
        break;
    }
  }
  private ["parse$factor"](): any {
    this.expectOneOf(["NUMBER", "MINUS", "LPAREN", "FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      case "NUMBER":
        this.nextToken();
        break;
      case "MINUS":
        this.nextToken();
        this["parse$factor"]();
        break;
      case "LPAREN":
        this.nextToken();
        this["parse$expression"]();
        this.expectOneOf(["RPAREN"]);
        this.nextToken();
        break;
      case "FUNCTION_NAME":
        this.nextToken();
        this.expectOneOf(["LPAREN"]);
        this.nextToken();
        this["parse$arguments"]();
        this.expectOneOf(["RPAREN"]);
        this.nextToken();
        break;
    }
  }
  private ["parse$arguments"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$expression"]();
        this["parse$varargs"]();
        break;
      default: // EPS
        break;
    }
  }
  private ["parse$varargs"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      case "COMMA":
        this.nextToken();
        this["parse$expression"]();
        this["parse$varargs"]();
        break;
      default: // EPS
        break;
    }
  }
}
