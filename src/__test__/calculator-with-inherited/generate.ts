import { parse, generateLexer, generateParser } from "@peggier/core";
import { Grammar } from "@peggier/grammar";
import fs from "fs";

export const readGrammar = async (): Promise<Grammar> => {
  const grammar = await fs.promises.readFile(
    'src/__test__/calculator-with-inherited/calculator.peggier',
    { encoding: 'utf-8' },
  );
  return parse(grammar);
}

export const generateLexerFile = async (path: string): Promise<void> => {
  const lexerSource = generateLexer(await readGrammar());
  await fs.promises.writeFile(path, lexerSource);
}

export const generateParserFile = async (path: string): Promise<void> => {
  const parserSource = generateParser(await readGrammar());
  await fs.promises.writeFile(path, parserSource);
}
