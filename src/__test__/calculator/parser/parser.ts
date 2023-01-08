
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
    this["parse$expression"]();
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

  private ["parse$expression"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$term"]();
        this["parse$expression'"]();
        return;
      }
    }

  private ["parse$expression'"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      // Rule 0
      case "PLUS":
        this.expectOneOf(["PLUS"]);
        this.nextToken();
        this["parse$term"]();
        this["parse$expression'"]();
        return;
      // Rule 1
      case "MINUS":
        this.expectOneOf(["MINUS"]);
        this.nextToken();
        this["parse$term"]();
        this["parse$expression'"]();
        return;
      // Rule 2
      case "EPS":
        return;
      }
    }

  private ["parse$term"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$factor"]();
        this["parse$term'"]();
        return;
      }
    }

  private ["parse$term'"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      // Rule 0
      case "MUL":
        this.expectOneOf(["MUL"]);
        this.nextToken();
        this["parse$factor"]();
        this["parse$term'"]();
        return;
      // Rule 1
      case "EPS":
        return;
      }
    }

  private ["parse$factor"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
        this.expectOneOf(["NUMBER"]);
        this.nextToken();
        return;
      // Rule 1
      case "MINUS":
        this.expectOneOf(["MINUS"]);
        this.nextToken();
        this["parse$factor"]();
        return;
      // Rule 2
      case "LPAREN":
        this.expectOneOf(["LPAREN"]);
        this.nextToken();
        this["parse$expression"]();
        this.expectOneOf(["RPAREN"]);
        this.nextToken();
        return;
      // Rule 3
      case "FUNCTION_NAME":
        this.expectOneOf(["FUNCTION_NAME"]);
        this.nextToken();
        this.expectOneOf(["LPAREN"]);
        this.nextToken();
        this["parse$arguments"]();
        this.expectOneOf(["RPAREN"]);
        this.nextToken();
        return;
      }
    }

  private ["parse$arguments"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        this["parse$expression"]();
        this["parse$varargs"]();
        return;
      // Rule 1
      case "EPS":
        return;
      }
    }

  private ["parse$varargs"](): any {
    // No expectOneOf because of EPS
    switch (this.curToken[0]) {
      // Rule 0
      case "COMMA":
        this.expectOneOf(["COMMA"]);
        this.nextToken();
        this["parse$expression"]();
        this["parse$varargs"]();
        return;
      // Rule 1
      case "EPS":
        return;
      }
    }
}
