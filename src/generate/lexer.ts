import { TerminalToken } from '@peggier/token';
import { Grammar } from '@peggier/grammar';

const makeCode = (tokens: string): string => `
type Token = [string, RegExp | string];

export class Lexer {
  private tokens: Token[] = [
    ${tokens}
  ]
  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < input.length) {
      let found = false;
      for (const [name, value] of this.tokens) {
        if (typeof value === "string") {
          if (input.startsWith(value, i)) {
            tokens.push([name, value]);
            i += value.length;
            found = true;
            break;
          }
        } else {
          const match = input.slice(i).match(value);
          if (match && match.index === 0) {
            tokens.push([name, match[0]]);
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
    return tokens;
  }
}
`;

export const generateLexer = (grammar: Grammar): string => {
  const tokens = grammar.tokens
    .filter((token) => token instanceof TerminalToken)
    .map(
      (token: TerminalToken) =>
        `["${token.name}", ${
          token.terminal.value instanceof RegExp
            ? token.terminal.value
            : JSON.stringify(token.terminal.value)
        }]`,
    );
  return makeCode(tokens.join(',\n    '));
};
