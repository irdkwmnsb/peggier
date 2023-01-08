import { Terminal } from "@peggier/terminal";

export type TokenRef = string;

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
  tokenRefs: TokenRef[];
  constructor(tokenRefs: TokenRef[]) {
    this.tokenRefs = tokenRefs;
  }
}

export class EpsilonRule extends Rule {
  constructor() {
    super([]);
  }
}

export class EOFRule extends Rule {
  constructor() {
    super(["EOF"]);
  }
}

export class NonterminalToken extends Token {
  rules: Rule[];
  constructor(name: string, rules: Rule[]) {
    super();
    this.name = name;
    this.rules = rules;
  }

  get hasEpsilonRule(): boolean {
    return this.rules.some((rule) => rule instanceof EpsilonRule);
  }
}
