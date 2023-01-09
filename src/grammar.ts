import {
  NonterminalToken,
  TerminalToken,
  Token,
  EpsilonRule,
  TokenRef,
  Rule,
  EOFTokenRef,
} from '@peggier/token';

export type TokenSetRules = { [key: string]: Record<string, number> };
type TokenSets = { [key: string]: Set<string> };

const setAllIsChanged = <K extends string | number | symbol, V>(obj: Record<K, V>, newVals: Record<K, V>): boolean => {
  let changed = false;
  for (const key in newVals) {
    if(!(key in obj)) {
      changed = true;
    }
    obj[key] = newVals[key];
  }
  return changed;
};

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
  private _firstSets?: TokenSetRules;
  private _followSets?: TokenSets;
  public readonly startRef: string;
  public readonly name: string;
  public readonly tokens: Token[];

  constructor(tokens: Token[], options?: Record<string, never>) {
    this.tokens = tokens.concat();
    this.startRef = options?.start || this.nonterminalTokens[0].name;
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

  get firstSets(): TokenSetRules {
    if (!this._firstSets) {
      this._firstSets = this.calculateFirst();
    }
    return this._firstSets;
  }

  public isTerminal(ref: TokenRef): boolean {
    return this.terminalTokens.some((token) => token.name === ref.ref) || ref instanceof EOFTokenRef;
  }

  private resolveRef(ref: TokenRef): Token {
    return this.tokens.find((token) => token.name === ref.ref);
  }

  private first(rule: TokenRef[], firstSets: TokenSetRules): Set<string> {
    const result = new Set<string>();
    if (rule instanceof EpsilonRule) {
      result.add('EPS');
      return result;
    }
    let hasNonEps = false;
    for (const ref of rule) {
      if (this.isTerminal(ref)) {
        result.add(ref.ref);
        hasNonEps = true;
        break;
      } else {
        const {EPS: _, ...first} = firstSets[ref.ref];
        for (const name of Object.keys(first)) {
          result.add(name);
        }
        if (!("EPS" in firstSets[ref.ref])) {
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

  private calculateFirst(): TokenSetRules {
    // Generate FIRST sets
    const firstSets: TokenSetRules = {};
    for (const token of this.nonterminalTokens) {
      firstSets[token.name] = {};
    }
    let changed = true;
    while (changed) {
      // console.log("=====");
      changed = false;
      for (const token of this.nonterminalTokens) {
        for (const [ruleIndex, rule] of token.rules.entries()) {
          // console.log(token, rule);
          const firstRules = this.first(rule.tokenRefs, firstSets)
          // console.log(firstRules);
          for (const name of firstRules) {
            if (!(name in firstSets[token.name])) {
              firstSets[token.name][name] = ruleIndex;
              changed = true;
            }
          }
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
    followSets[this.startRef].add('$');
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
              followSets[ref.ref],
              [...setMinus(first, new Set(['EPS']))],
            );
            if (first.has('EPS')) {
              changed ||= setAddAllIsChanged(
                followSets[ref.ref],
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
