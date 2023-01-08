import { TerminalToken } from '@peggier/token';
import { Grammar } from '@peggier/grammar';

const makeCode = (tokens: string): string => `
type TokenDecl = [string, RegExp | string, "TAKE" | "SKIP"];
export type Token = [string, string];
export class Lexer {
  private tokens: TokenDecl[] = [
    ${tokens}
  ]
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < input.length) {
      let found = false;
      for (const [name, value, action] of this.tokens) {
        if (typeof value === "string") {
          if (input.startsWith(value, i)) {
            if (action === "TAKE") {
              tokens.push([name, value]);
            }
            i += value.length;
            found = true;
            break;
          }
        } else {
          const match = input.slice(i).match(value);
          if (match && match.index === 0) {
            if(action === "TAKE") {
              tokens.push([name, match[0]]);
            }
            i += match[0].length;
            found = true;
            break;
          }
        }
      }
      if (!found) {
        throw new Error(\`Unexpected character \${input[i]}\`);
      }
    }
    tokens.push(["EOF", ""]);
    return tokens;
  }
}
`;

export const generateLexer = (grammar: Grammar): string => {
  const tokens = grammar.terminalTokens
    .map(
      (token: TerminalToken) =>
        `["${token.name}", ${
          token.terminal.value instanceof RegExp
            ? token.terminal.value
            : JSON.stringify(token.terminal.value)
        }, "${token.action || 'TAKE'}"]`,
    );
  return makeCode(tokens.join(',\n    '));
};
