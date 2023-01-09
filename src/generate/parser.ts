import { Grammar, TokenSetRules } from '@peggier/grammar';
import { BindedTokenRef, NonterminalToken, Rule, Token } from '@peggier/token';
import util from 'util';

const ident = (code: string): string => {
  return code
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');
};

const makeParser = (
  firstSets: TokenSetRules,
  tokensCode: string[],
  actionsCode: string[],
  start: string,
) => `
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
    return this["parse$${start}"]();
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

  private readToken(type: string): string {
    this.expectOneOf([type]);
    const token = this.curToken[1];
    this.nextToken();
    return token;
  }

  // Actions
${actionsCode.map((code) => ident(code)).join('\n\n')}

  // Tokens
${tokensCode.map((code) => ident(code)).join('\n\n')}
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
    // Rule ${ruleIndex}
    `;
    for (const [termName, termRuleIndex] of Object.entries(firstSetForToken)) {
      if (termRuleIndex === ruleIndex) {
        if(termName === "EPS") {
          rulesSwitch += `default:
    `
        } else {
          rulesSwitch += `case "${termName}":
    `;
        }
      }
    }
    rulesSwitch += "  ";
    for (const tokenRef of rule.tokenRefs) {
      if (tokenRef instanceof BindedTokenRef && tokenRef.label) {
        rulesSwitch += `parsedResults[${JSON.stringify(tokenRef.label)}] = `;
      }
      if (grammar.isTerminal(tokenRef)) {
        rulesSwitch += `this.readToken(${JSON.stringify(tokenRef.ref)});
      `;
      } else {
        rulesSwitch += `this["parse$${tokenRef.ref}"]();
      `;
      }
    }
    if(rule.action) {
      const argumentsForAction = extractNames(rule).map((tokenRef) => `parsedResults[${JSON.stringify(tokenRef)}]`).join(", ");
      rulesSwitch += `return this["action$${token.name}$${ruleIndex}"](${argumentsForAction});`;
    } else {
      rulesSwitch += `return parsedResults;`;
    }
  }
  return (
    `private ["parse$${token.name}"](): any {` +
    (token.hasEpsilonRule
      ? `
  // No expectOneOf because of EPS`
      : `
  this.expectOneOf(${JSON.stringify(Object.keys(firstSet[token.name]))});`) +
    `
  const parsedResults: Record<string, any> = {};
  switch (this.curToken[0]) {` +
    rulesSwitch +
    `
  }
}`
  );
};

const extractNames = (rule: Rule): string[] => (rule.tokenRefs
  .filter((tokenRef) => tokenRef instanceof BindedTokenRef) as BindedTokenRef[])
  .map((tokenRef) => tokenRef.label)
  .filter((tokenRef) => tokenRef !== null)

const makeActionsCode = (token: NonterminalToken): string => {
  let result = `// Actions for ${token.name}`;
  for (const [ruleIndex, rule] of token.rules.entries()) {
    const code = rule.action;
    const usedNames = extractNames(rule)
      .map((tokenRef) => tokenRef + ": any");
    if (code) {
      result += `
private ["action$${token.name}$${ruleIndex}"](${usedNames.join(", ")}): any {
${ident(code.replaceAll(/^\n*/g, "").replaceAll(/\n*$/g, ""))}
}`;
    }
  }
  return result;
};

export const generateParser = (grammar: Grammar): string => {
  const firstSets = grammar.firstSets;
  const tokensCode = grammar.nonterminalTokens.map((token) =>
    makeTokenCode(token, firstSets, grammar),
  );

  const actionsCode = grammar.nonterminalTokens.map(
    makeActionsCode,
  ) as string[];

  return makeParser(firstSets, tokensCode, actionsCode, grammar.startRef);
};
