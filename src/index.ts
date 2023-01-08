import { Command } from 'commander';
import fs from 'fs';
import util from 'util';
import { generateParser, parse } from '@peggier/core';
import { PeggySyntaxError } from "@peggier/parser";
const program = new Command();

program.command('generate <path>').action(async (path: string) => {
  console.log(`Generating parser for ${path}`);
  const grammar = await fs.promises.readFile(path, { encoding: 'utf-8' });
  console.log(grammar);
  try {
    const result = parse(grammar);
    console.log("Parsed to: ");
    console.log(util.inspect(result, { depth: null, colors: true }));
    // const lexer = generateLexer(result);
    // console.log(lexer);
    // console.log("First sets:");
    // console.log(result.firstSets);
    // console.log("Follow sets:");
    // console.log(result.followSets);
    console.log("Generated parser");
    const parser = generateParser(result);
    console.log(parser);
  } catch (e) {
    if(e instanceof PeggySyntaxError) {
      console.error(e);
      console.log("ERROR parsing grammar: " + e.message);
      grammar.split("\n").forEach((line, index) => {
        if(index + 1 === e.location.start.line) {
          console.log(line);
          console.log(" ".repeat(e.location.start.column - 1) + "^".repeat(e.location.end.column - e.location.start.column));
        }
      });
    } else {
      console.error(e);
    }
  }
});
program.parse();
