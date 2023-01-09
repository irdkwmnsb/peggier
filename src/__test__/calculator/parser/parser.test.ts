import fs from 'fs';
import { generateLexerFile, generateParserFile } from '../generate';

describe('Calculator parser tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Parser: any = null;
  beforeAll(async () => {
    await generateLexerFile('src/__test__/calculator/parser/lexer.ts');
    await generateParserFile('src/__test__/calculator/parser/parser.ts');
    Parser = (await require('./parser')).Parser;
  });
  test('Parser should parse numbers', () => {
    expect(() => Parser.parse('123')).not.toThrow();
  });
  test('Parser should parse operators', () => {
    expect(() => Parser.parse('1 + 2')).not.toThrow();
  });
  test('Parser should parse unary minus', () => {
    expect(() => Parser.parse('-1 - -2')).not.toThrow();
  });
  test('Parser should parse functions with no arguments', () => {
    expect(() => Parser.parse('random()')).not.toThrow();
  })
  test('Parser should parse functions', () => {
    expect(() => Parser.parse('sin(1)')).not.toThrow();
  });
  test('Parser should parse function with multiple arguments', () => {
    expect(() => Parser.parse('sin(1,2)')).not.toThrow();
  });
  test('Parser should parse hard cases', () => {
    expect(() => Parser.parse('( 2 + 3 ) - 5 * sin ( 3 * 7 )')).not.toThrow();
    expect(() => Parser.parse('1 + 2 + 3 * 4')).not.toThrow();
  });
  test('Parser should throw on unexpected character', () => {
    expect(() => Parser.parse('sin(1)@')).toThrow(
      'Unexpected character @',
    );
  });
  test('Parser should throw on syntax error', () => {
    expect(() => Parser.parse('sin 1')).toThrow(
      'Expected LPAREN but got NUMBER (1)',
    );
    expect(() => Parser.parse('sin(1')).toThrow(
      'Expected RPAREN but got EOF'
    );
  });
});
