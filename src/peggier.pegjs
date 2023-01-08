{{
/* eslint-disable */
import { StringTerminal, RegexpTerminal } from "@peggier/terminal";
import { TerminalToken, Rule, EpsilonRule, NonterminalToken } from "@peggier/token";
import { Grammar } from "@peggier/grammar";
}}
peggier = options: header _ grammar: grammar { return new Grammar(grammar, options) }

header = properties: ((@headerProperty _) *) {
    return properties.reduce((acc: any, prop: any) => {
        return {...acc, ...prop}
    }, {});
}
headerProperty = @(@headerStart / @headerName) _ ";"
headerStart = "!start" _ start: nontermName { return { start: start } }
headerName = "!name" _ name: stringLiteral { return { name: name } }


grammar = @(rule*)

rule = @(termRule / nontermRule) ";" _

// nonterminals
nontermRule = name: nontermName _ "=" _ rules: ruleExpr {
    return new NonterminalToken(name, rules);
}
nontermName = [a-z][A-Za-z0-9_']* { return text(); }
ruleExpr = first: ruleTerm _ rest: ("/" _ @ruleTerm)* {
    return [first, ...rest];
}

ruleTerm = "EPS" _ { return new EpsilonRule(); } /
terms: (@(@termName / @nontermName) _ )+ {
    return new Rule(terms);
}

// terminals
termRule = name: termName _ "=" _ literal: termLiteral _ action: termAction?  {
    return new TerminalToken(name, literal, action);
}
termName = [A-Z][A-Za-z0-9_']* { return text(); }
termLiteral = stringTerm / regexpTerm
termAction = "{" _ "TAKE" _ "}" { return "TAKE" } / "{" _ "SKIP" _ "}" { return "SKIP" }
stringTerm = str: stringLiteral { return new StringTerminal(str) }
regexpTerm = regex: regexLiteral { return new RegexpTerminal(regex) }

stringLiteral = "\"" val:([^"] / "\\\"")+ "\"" { return val.join("").replace('\\"', '"'); }
regexLiteral = "/" val:([^/] / "\\/")+ "/" { return new RegExp(val.join("").replace("\\/", "/")); }


_  = [ \t\r\n]*
__ = [ \t\r\n]+
