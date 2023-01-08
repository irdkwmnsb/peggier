import {
  NonterminalToken,
  TerminalToken,
  Token,
  EpsilonRule,
  TokenRef,
  Rule,
} from '@peggier/token';

type TokenSets = { [key: string]: Set<string> };

const setAddAllIsChanged = <T>(set: Set<T>, value: T[]): boolean => {
  const size = set.size;
  for (const item of value) {
    set.add(item);
  }
  return size !== set.size;
};

const setMinus = <T>(set1: Set<T>, set2: Set<T>): Set<T> => {
  const result = new Set<T>();
  for (const value of set1) {
    if (!set2.has(value)) {
      result.add(value);
    }
  }
  return result;
};

export class Grammar {
  private _firstSets?: TokenSets;
  private _followSets?: TokenSets;
  private _start: TokenRef;
  public readonly name: string;
  public readonly tokens: Token[];

  constructor(tokens: Token[], options?: Record<string, never>) {
    this.tokens = tokens;
    this._start = options?.start || this.nonterminalTokens[0].name;
    this.name = options?.name || 'Grammar';
  }

  get terminalTokens(): TerminalToken[] {
    return this.tokens.filter(
      (token) => token instanceof TerminalToken,
    ) as TerminalToken[];
  }

  get nonterminalTokens(): NonterminalToken[] {
    return this.tokens.filter(
      (token) => token instanceof NonterminalToken,
    ) as NonterminalToken[];
  }

  get firstSets(): TokenSets {
    if (!this._firstSets) {
      this._firstSets = this.calculateFirst();
    }
    return this._firstSets;
  }

  private isTerminal(ref: TokenRef): boolean {
    return this.terminalTokens.some((token) => token.name === ref);
  }

  private resolveRef(ref: TokenRef): Token {
    return this.tokens.find((token) => token.name === ref);
  }

  private first(rule: TokenRef[], firstSets: TokenSets): Set<string> {
    const result = new Set<string>();
    if (rule instanceof EpsilonRule) {
      result.add('EPS');
      return result;
    }
    let hasNonEps = false;
    for (const ref of rule) {
      if (this.isTerminal(ref)) {
        result.add(ref);
        hasNonEps = true;
        break;
      } else {
        const first = setMinus(firstSets[ref], new Set(['EPS']));
        for (const name of first) {
          result.add(name);
        }
        if (!firstSets[ref].has('EPS')) {
          hasNonEps = true;
          break;
        }
      }
    }
    if(!hasNonEps) {
      result.add('EPS');
    }
    return result;
  }

  private calculateFirst(): TokenSets {
    // Generate FIRST sets
    const firstSets: TokenSets = {};
    for (const token of this.nonterminalTokens) {
      firstSets[token.name] = new Set();
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const token of this.nonterminalTokens) {
        for (const rule of token.rules) {
          changed ||= setAddAllIsChanged(
            firstSets[token.name],
            [...this.first(rule.tokenRefs, firstSets)],
          );
        }
      }
    }
    return firstSets;
  }

  get followSets(): TokenSets {
    if (!this._followSets) {
      this._followSets = this.calculateFollow();
    }
    return this._followSets;
  }
  calculateFollow(): TokenSets {
    const followSets: TokenSets = {};
    for (const token of this.nonterminalTokens) {
      followSets[token.name] = new Set();
    }
    followSets[this._start].add('$');
    let changed = true;
    while (changed) {
      changed = false;
      for (const token of this.nonterminalTokens) {
        for (const rule of token.rules) {
          for (let i = 0; i < rule.tokenRefs.length; i++) {
            const ref = rule.tokenRefs[i];
            if (this.isTerminal(ref)) {
              continue;
            }
            const first  = this.first(rule.tokenRefs.slice(i + 1), this.firstSets)
            changed ||= setAddAllIsChanged(
              followSets[ref],
              [...setMinus(first, new Set(['EPS']))],
            );
            if (first.has('EPS')) {
              changed ||= setAddAllIsChanged(
                followSets[ref],
                [...followSets[token.name]],
              );
            }
          }
        }
      }
    }
    return followSets;
  }
}
