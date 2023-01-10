
import { Lexer, Token } from "./lexer";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// First sets:
// {
//   expressionStart: { NUMBER: 0, MINUS: 0, LPAREN: 0, FUNCTION_NAME: 0 },
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
    return this["parse$expressionStart"]();
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
  // Actions for expressionStart
  private ["action$expressionStart$0"](res: any): any {
      return res;
  }

  // Actions for expression
  private ["action$expression$0"](left: any, res: any): any {
      return res;
  }

  // Actions for expression'
  private ["action$expression'$0"](left: any, right: any, ans: any): any {
      return ans;
  }
  private ["action$expression'$1"](left: any, right: any, ans: any): any {
      return ans;
  }
  private ["action$expression'$2"](left: any): any {
      return left;
  }

  // Actions for term
  private ["action$term$0"](left: any, res: any): any {
      return res;
  }

  // Actions for term'
  private ["action$term'$0"](left: any, right: any, res: any): any {
      return res;
  }
  private ["action$term'$1"](left: any): any {
      return left;
  }

  // Actions for factor
  private ["action$factor$0"](num: any): any {
     return parseInt(num);
  }
  private ["action$factor$1"](num: any): any {
     return -num;
  }
  private ["action$factor$2"](expr: any): any {
     return expr
  }
  private ["action$factor$3"](f: any, args: any): any {
     return (Math as any)[f].apply(null, args);
  }

  // Actions for arguments
  private ["action$arguments$0"](first: any, rest: any): any {
      return [first].concat(rest);
  }
  private ["action$arguments$1"](): any {
      return [];
  }

  // Actions for varargs
  private ["action$varargs$0"](first: any, rest: any): any {
      return [first].concat(rest);
  }
  private ["action$varargs$1"](): any {
      return [];
  }

  // Tokens
  private ["parse$expressionStart"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        parsedResults["res"] = this["parse$expression"]();
        this.readToken("EOF");
        return this["action$expressionStart$0"](parsedResults["res"]);
    }
  }

  private ["parse$expression"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
      case "MINUS":
      case "LPAREN":
      case "FUNCTION_NAME":
        parsedResults["left"] = this["parse$term"]();
        parsedResults["res"] = this["parse$expression'"](parsedResults["left"]);
        return this["action$expression$0"](parsedResults["left"], parsedResults["res"]);
    }
  }

  private ["parse$expression'"](left: any): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "PLUS":
        this.readToken("PLUS");
        parsedResults["right"] = this["parse$term"]();
        parsedResults["ans"] = this["parse$expression'"](this["argument$expression'$0$2$0"](left, parsedResults["right"]));
        return this["action$expression'$0"](left, parsedResults["right"], parsedResults["ans"]);
      // Rule 1
      case "MINUS":
        this.readToken("MINUS");
        parsedResults["right"] = this["parse$term"]();
        parsedResults["ans"] = this["parse$expression'"](this["argument$expression'$1$2$0"](left, parsedResults["right"]));
        return this["action$expression'$1"](left, parsedResults["right"], parsedResults["ans"]);
      // Rule 2
      default:
        return this["action$expression'$2"](left);
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
        parsedResults["left"] = this["parse$factor"]();
        parsedResults["res"] = this["parse$term'"](parsedResults["left"]);
        return this["action$term$0"](parsedResults["left"], parsedResults["res"]);
    }
  }

  private ["parse$term'"](left: any): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "MUL":
        this.readToken("MUL");
        parsedResults["right"] = this["parse$factor"]();
        parsedResults["res"] = this["parse$term'"](this["argument$term'$0$2$0"](left, parsedResults["right"]));
        return this["action$term'$0"](left, parsedResults["right"], parsedResults["res"]);
      // Rule 1
      default:
        return this["action$term'$1"](left);
    }
  }

  private ["parse$factor"](): any {
    this.expectOneOf(["NUMBER","MINUS","LPAREN","FUNCTION_NAME"]);
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "NUMBER":
        parsedResults["num"] = this.readToken("NUMBER");
        return this["action$factor$0"](parsedResults["num"]);
      // Rule 1
      case "MINUS":
        this.readToken("MINUS");
        parsedResults["num"] = this["parse$factor"]();
        return this["action$factor$1"](parsedResults["num"]);
      // Rule 2
      case "LPAREN":
        this.readToken("LPAREN");
        parsedResults["expr"] = this["parse$expression"]();
        this.readToken("RPAREN");
        return this["action$factor$2"](parsedResults["expr"]);
      // Rule 3
      case "FUNCTION_NAME":
        parsedResults["f"] = this.readToken("FUNCTION_NAME");
        this.readToken("LPAREN");
        parsedResults["args"] = this["parse$arguments"]();
        this.readToken("RPAREN");
        return this["action$factor$3"](parsedResults["f"], parsedResults["args"]);
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
        parsedResults["first"] = this["parse$expression"]();
        parsedResults["rest"] = this["parse$varargs"]();
        return this["action$arguments$0"](parsedResults["first"], parsedResults["rest"]);
      // Rule 1
      default:
        return this["action$arguments$1"]();
    }
  }

  private ["parse$varargs"](): any {
    // No expectOneOf because of EPS
    const parsedResults: Record<string, any> = {};
    switch (this.curToken[0]) {
      // Rule 0
      case "COMMA":
        this.readToken("COMMA");
        parsedResults["first"] = this["parse$expression"]();
        parsedResults["rest"] = this["parse$varargs"]();
        return this["action$varargs$0"](parsedResults["first"], parsedResults["rest"]);
      // Rule 1
      default:
        return this["action$varargs$1"]();
    }
  }

  // Arguments
  // Argument for expression', rule number 0, reference number 2, argument number 0
  private ["argument$expression'$0$2$0"](left: any, right: any): any {
     return left + right;
  }

  // Argument for expression', rule number 1, reference number 2, argument number 0
  private ["argument$expression'$1$2$0"](left: any, right: any): any {
     return left - right;
  }

  // Argument for term', rule number 0, reference number 2, argument number 0
  private ["argument$term'$0$2$0"](left: any, right: any): any {
     return left * right;
  }
}
