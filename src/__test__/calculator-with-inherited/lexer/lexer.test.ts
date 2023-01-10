import { generateLexerFile } from '../generate';

describe('Calculator with inherited lexer tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lexer: any = null;
  beforeAll(async () => {
    await generateLexerFile('src/__test__/calculator-with-inherited/lexer/lexer.ts');
    const { Lexer } = await require('./lexer');
    lexer = new Lexer();
  });

  test('Lexer should tokenize numbers', () => {
    expect(lexer.tokenize('123')).toEqual([['NUMBER', '123'], ['EOF', '']]);
  });

  test('Lexer should tokenize operators', () => {
    expect(lexer.tokenize('+')).toEqual([['PLUS', '+'], ['EOF', '']]);
  });

  test('Lexer should tokenize functions', () => {
    expect(lexer.tokenize('sin')).toEqual([['FUNCTION_NAME', 'sin'], ['EOF', '']]);
  });

  test('Lexer should tokenize function calls', () => {
    expect(lexer.tokenize('sin(1)')).toEqual([
      ['FUNCTION_NAME', 'sin'],
      ['LPAREN', '('],
      ['NUMBER', '1'],
      ['RPAREN', ')'],
      ['EOF', ''],
    ]);
  });
  test('Lexer should throw on unexpected character', () => {
    expect(() => lexer.tokenize('sin(1)@')).toThrow(
      'Unexpected character @',
    );
  });
});
