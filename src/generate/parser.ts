import { Grammar, TokenSetRules } from '@peggier/grammar';
import { NonterminalToken } from '@peggier/token';
import util from 'util';

const makeParser = (firstSets: TokenSetRules, tokensCode: string[], start: string) => `
import { Lexer, Token } from "./lexer";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// First sets:
// ${util
  .inspect(firstSets, { depth: null })
  .toString()
  .replaceAll('\n', '\n// ')}

export class Parser {
  private tokens: Token[];
  private curTokenIndex = 0;
  private get curToken(): Token {
    return this.tokens[this.curTokenIndex];
  }

  private startParse(input: string): any {
    this.tokens = new Lexer().tokenize(input);
    this["parse$${start}"]();
  }

  public static parse(input: string): any {
    return new Parser().startParse(input);
  }

  private nextToken(): Token {
    return this.tokens[this.curTokenIndex++];
  }

  private expectOneOf(names: string[]): void {
    if (!names.includes(this.curToken[0])) {
      throw new ParseError(\`Expected \${names.length === 1 ? "" : "one of "}\${names.join(", ")} but got \${this.curToken[0]}\${this.curToken[0] === "EOF" ? "" : " (" + this.curToken[1] + ")"})\`);
    }
  }

  ${tokensCode.map((code) => code.split('\n').join('\n  ')).join('\n\n  ')}
}
`;

const makeTokenCode = (
  token: NonterminalToken,
  firstSet: TokenSetRules,
  grammar: Grammar,
): string => {
  const firstSetForToken = firstSet[token.name];
  let rulesSwitch = '';
  for (const [ruleIndex, rule] of token.rules.entries()) {
    rulesSwitch += `
    // Rule ${ruleIndex}`;
    for (const [termName, termRuleIndex] of Object.entries(firstSetForToken)) {
      if (termRuleIndex === ruleIndex) {
        rulesSwitch += `
    case "${termName}":`;
      }
    }
    for (const tokenRef of rule.tokenRefs) {
      if (grammar.isTerminal(tokenRef)) {
        rulesSwitch += `
      this.expectOneOf(${JSON.stringify([tokenRef])});
      this.nextToken();`;
      } else {
        rulesSwitch += `
      this["parse$${tokenRef}"]();`;
      }
    }
    rulesSwitch += `
      return;`;
  }
  return (
    `private ["parse$${token.name}"](): any {` +
    (token.hasEpsilonRule
      ? `
  // No expectOneOf because of EPS`
      : `
  this.expectOneOf(${JSON.stringify(Object.keys(firstSet[token.name]))});`) +
    `
  switch (this.curToken[0]) {` +
    rulesSwitch +
    `
    }
  }`
  );
};

export const generateParser = (grammar: Grammar): string => {
  const firstSets = grammar.firstSets;
  const tokensCode = grammar.nonterminalTokens.map((token) =>
    makeTokenCode(token, firstSets, grammar),
  );
  return makeParser(firstSets, tokensCode, grammar.start);
};
