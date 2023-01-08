{{
/* eslint-disable */
import { StringTerminal, RegexpTerminal } from "@peggier/terminal";
import { TerminalToken, Rule, NonterminalToken } from "@peggier/token";
import { Grammar } from "@peggier/grammar";
}}
grammar = rules: (rule*) { return new Grammar(rules); }

rule = @(termRule / nontermRule) ";" _

// nonterminals
nontermRule = name: nontermName _ "=" _ rules: ruleExpr {
    return new NonterminalToken(name, rules);
}
nontermName = [a-z][A-Za-z0-9_']* { return text(); }
ruleExpr = @ruleTerm _ ("/" _ @ruleTerm)*
ruleTerm = terms: ((@termName / @nontermName) _ )* {
    return new Rule(terms);
}

// terminals
termRule = name: termName _ "=" _ literal: termLiteral {
    return new TerminalToken(name, literal);
}
termName = [A-Z][A-Za-z0-9_']* { return text(); }
termLiteral = stringLiteral / regexLiteral
stringLiteral = "\"" val:([^"] / "\\\"")+ "\"" { return new StringTerminal(val.join("").replace('\\"', '"')); }
regexLiteral = "/" val:([^/] / "\\/")+ "/" { return new RegexpTerminal(new RegExp(val.join("").replace("\\/", "/"))); }


_  = [ \t\r\n]*
__ = [ \t\r\n]+
