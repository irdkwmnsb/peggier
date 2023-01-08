import { Terminal } from "@peggier/terminal";

export class Token {
  name: string;
}

export class TerminalToken extends Token {
  terminal: Terminal;
  constructor(name: string, terminal: Terminal) {
    super();
    this.name = name;
    this.terminal = terminal;
  }
}

export class Rule {
  tokenRefs: string[];
  constructor(tokenRefs: string[]) {
    this.tokenRefs = tokenRefs;
  }
}

export class NonterminalToken extends Token {
  rules: Rule[];
  constructor(name: string, rules: Rule[]) {
    super();
    this.name = name;
    this.rules = rules;
  }
}
