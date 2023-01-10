import { Grammar, TokenSetRules } from '@peggier/grammar';
import {
  BindedTokenRef,
  CodeArgument,
  NonterminalToken,
  RefArgument,
  Rule,
  Token,
} from '@peggier/token';
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
  argumentsCode: string[],
  start: string,
): string => `
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
${actionsCode.map((code) => ident(code)).join('\n\n')}

  // Tokens
${tokensCode.map((code) => ident(code)).join('\n\n')}

  // Arguments
${argumentsCode.map((code) => ident(code)).join('\n\n')}
}
`;

const makeTokenCode = (
  token: NonterminalToken,
  firstSet: TokenSetRules,
  grammar: Grammar,
): string => {
  const firstSetForToken = firstSet[token.name];
  const thisTokenArgs = extractTokenArguments(token);
  let rulesSwitch = '';
  for (const [ruleIndex, rule] of token.rules.entries()) {
    rulesSwitch += `
    // Rule ${ruleIndex}
    `;
    for (const [termName, termRuleIndex] of Object.entries(firstSetForToken)) {
      if (termRuleIndex === ruleIndex) {
        if (termName === 'EPS') {
          rulesSwitch += `default:
    `;
        } else {
          rulesSwitch += `case "${termName}":
    `;
        }
      }
    }
    rulesSwitch += '  ';
    for (const [refIndex, tokenRef] of rule.tokenRefs.entries()) {
      if (tokenRef instanceof BindedTokenRef && tokenRef.label) {
        rulesSwitch += `parsedResults[${JSON.stringify(tokenRef.label)}] = `;
      }
      if (grammar.isTerminal(tokenRef)) {
        rulesSwitch += `this.readToken(${JSON.stringify(tokenRef.ref)});
      `;
      } else {
        const args = [];
        if(tokenRef instanceof BindedTokenRef && tokenRef.args) {
          for(const [argIndex, arg] of tokenRef.args.entries()) {
            if(arg instanceof CodeArgument) {
              const codeFunc = makeArgumentFuncName(token, ruleIndex, refIndex, argIndex);
              const codeArgs = [...thisTokenArgs, ...extractNames(rule, refIndex).map((name) => `parsedResults[${JSON.stringify(name)}]`)];
              args.push(`this["${codeFunc}"](${codeArgs.join(', ')})`);
            } else if (arg instanceof RefArgument) {
              if(thisTokenArgs.indexOf(arg.ref) !== -1) {
                args.push(arg.ref);
              } else {
                args.push(`parsedResults[${JSON.stringify(arg.ref)}]`);
              }
            }
          }
        }
        rulesSwitch += `this["parse$${tokenRef.ref}"](${args.join(', ')});
      `;
      }
    }
    if (rule.action) {
      const argumentsForAction = [...extractTokenArguments(token), ...extractNames(rule)]
        .map((tokenRef) => thisTokenArgs.indexOf(tokenRef) !== -1 ? tokenRef : `parsedResults[${JSON.stringify(tokenRef)}]`)
        .join(', ');
      rulesSwitch += `return this["action$${token.name}$${ruleIndex}"](${argumentsForAction});`;
    } else {
      rulesSwitch += `return parsedResults;`;
    }
  }
  const tokenArgs = token.args?.map((arg) => {
    if (arg instanceof RefArgument) {
      return arg.ref;
    }
  }
  ) || [];
  return (
    `private ["parse$${token.name}"](${anify(tokenArgs).join(", ")}): any {` +
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

const anify = (args: string[]): string[] => args.map((arg) => arg + ": any");

const extractTokenArguments = (token: Token): string[] => {
  if(token instanceof NonterminalToken && token.args) {
    return token.args.map((a) => a.ref);
  } else {
    return [];
  }
}

const extractNames = (rule: Rule, upTo: number = undefined): string[] =>
  (
    [...rule.tokenRefs
      .slice(0, upTo)
      .filter(
        (tokenRef) => tokenRef instanceof BindedTokenRef,
      ) as BindedTokenRef[]]
  )
    .map((tokenRef) => tokenRef.label)
    .filter((tokenRef) => tokenRef !== null);

const makeActionCode = (token: NonterminalToken): string => {
  let result = `// Actions for ${token.name}`;
  const tokenArgs = extractTokenArguments(token);
  for (const [ruleIndex, rule] of token.rules.entries()) {
    const code = rule.action;
    const usedNames = anify([...tokenArgs, ...extractNames(rule)]);
    if (code) {
      result += `
private ["action$${token.name}$${ruleIndex}"](${usedNames.join(', ')}): any {
${ident(code.replaceAll(/^\n*/g, '').replaceAll(/\n*$/g, ''))}
}`;
    }
  }
  return result;
};

const makeArgumentFuncName = (token: Token, ruleIndex: number, refIndex: number, argumentIndex: number): string => `argument$${token.name}$${ruleIndex}$${refIndex}$${argumentIndex}`

const makeArgumentsCode = (grammar: Grammar): string[] => {
  const code = [];
  for (const token of grammar.nonterminalTokens) {
    const tokenArgs = extractTokenArguments(token);
    for (const [ruleIndex, rule] of token.rules.entries()) {
      const usedNames: string[] = [];
      for (const [refIndex, tokenRef] of rule.tokenRefs.entries()) {
        if (usedNames.some((name) => tokenArgs.includes(name))) {
          throw new Error(
            `Argument name conflict in ${token.name} rule ${ruleIndex}`,
          );
        }
        if (tokenRef instanceof BindedTokenRef) {
          if (tokenRef.args) {
            for (const [argumentIndex, argument] of tokenRef.args.entries()) {
              if (argument instanceof RefArgument) {
                continue;
              }
              let argumentCode = `// Argument for ${token.name}, rule number ${ruleIndex}, reference number ${refIndex}, argument number ${argumentIndex}\n`;
              const funcName = makeArgumentFuncName(token, ruleIndex, refIndex, argumentIndex);
              const allArgs = [...tokenArgs, ...usedNames];
              argumentCode += `private ["${funcName}"](${allArgs
                .map((name) => name + ': any')
                .join(', ')}): any {\n`;
              argumentCode += `${ident(
                argument.code.replaceAll(/^\n*/g, '').replaceAll(/\n*$/g, ''),
              )}\n`;
              argumentCode += `}`;
              code.push(argumentCode);
            }
          }
          if(tokenRef.label) {
            usedNames.push(tokenRef.label);
          }
        }
      }
    }
  }
  return code;
};

export const generateParser = (grammar: Grammar): string => {
  const firstSets = grammar.firstSets;
  const tokensCode = grammar.nonterminalTokens.map((token) =>
    makeTokenCode(token, firstSets, grammar),
  );

  const actionsCode = grammar.nonterminalTokens.map(makeActionCode) as string[];

  const argumentsCode = makeArgumentsCode(grammar);

  return makeParser(
    firstSets,
    tokensCode,
    actionsCode,
    argumentsCode,
    grammar.startRef,
  );
};
