import { parse, generateLexer } from '@peggier/core';
import fs from 'fs';
import {dynamicImport} from 'tsimportlib';

describe('Calculator lexer tests', () => {
  let lexer: any = null;
  beforeAll(async () => {
    const grammar = await fs.promises.readFile(
      'src/__test__/calculator/calculator.peggier',
      { encoding: 'utf-8' },
    );
    const result = parse(grammar);
    const lexerSource = generateLexer(result);
    await fs.promises.writeFile('src/__test__/calculator/lexer/lexer.ts', lexerSource);
    const { Lexer } = await require('./lexer');
    lexer = new Lexer();
  });

  test('Lexer should tokenize numbers', () => {
    expect(lexer.tokenize('123')).toEqual([['NUMBER', '123']]);
  });

  test('Lexer should tokenize operators', () => {
    expect(lexer.tokenize('+')).toEqual([['PLUS', '+']]);
  });

  test('Lexer should tokenize functions', () => {
    expect(lexer.tokenize('sin')).toEqual([['FUNCTION_NAME', 'sin']]);
  });

  test('Lexer should tokenize function calls', () => {
    expect(lexer.tokenize('sin(1)')).toEqual([
      ['FUNCTION_NAME', 'sin'],
      ['LPAREN', '('],
      ['NUMBER', '1'],
      ['RPAREN', ')'],
    ]);
  });
  test('Lexer should throw on unexpected character', () => {
    expect(() => lexer.tokenize('sin(1)@')).toThrow(
      'Unexpected character @',
    );
  });
});
