import { Terminal } from "@peggier/terminal";

export type TokenRef = string;

export type TerminalTokenAction = "TAKE" | "SKIP";

export class Token {
  name: string;
}

export class TerminalToken extends Token {
  terminal: Terminal;
  action?: TerminalTokenAction;
  constructor(name: string, terminal: Terminal, action?: TerminalTokenAction) {
    super();
    this.name = name;
    this.terminal = terminal;
    this.action = action;
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
