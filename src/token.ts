import { Terminal } from "@peggier/terminal";

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

export class BindedTokenRef {
  ref: string;
  label: string;
  constructor(ref: string, label: string) {
    this.ref = ref;
    this.label = label;
  }
}

export class EOFTokenRef {
  ref = "EOF";
}

export type TokenRef = BindedTokenRef | EOFTokenRef;

export class Rule {
  tokenRefs: TokenRef[];
  action?: string;
  constructor(tokenRefs: TokenRef[], action?: string) {
    this.tokenRefs = tokenRefs;
    this.action = action;
  }
}

export class EpsilonRule extends Rule {
  constructor(action?: string) {
    super([], action);
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
