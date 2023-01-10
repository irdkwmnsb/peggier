import { generateLexerFile, generateParserFile } from '../generate';

describe('Calculator with synthesized parser tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Parser: any = null;
  beforeAll(async () => {
    await generateLexerFile(
      'src/__test__/calculator-with-synthesized/parser/lexer.ts',
    );
    await generateParserFile(
      'src/__test__/calculator-with-synthesized/parser/parser.ts',
    );
    Parser = (await require('./parser')).Parser;
  });
  test('Parser should parse numbers', () => {
    expect(Parser.parse('123')).toEqual(123);
  });
  test('Parser should parse operators', () => {
    expect(Parser.parse('1 + 2')).toEqual(3);
    expect(Parser.parse('1 - 2')).toEqual(-1);
    expect(Parser.parse('1 * 2')).toEqual(2);
  });
  test('Parser should parse unary minus', () => {
    expect(Parser.parse('-1 - -2')).toEqual(-1 - -2);
  });
  test('Parser should parse functions with no arguments', () => {
    const val = Parser.parse('random()');
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  })
  test('Parser should parse functions', () => {
    expect(Parser.parse('sin(1)')).toEqual(Math.sin(1));
    expect(Parser.parse('sin(tan(1))')).toEqual(Math.sin(Math.tan(1)));
    expect(Parser.parse('sin(1) + cos(2)')).toEqual(Math.sin(1) + Math.cos(2));
  });
  test('Parser should parse function with multiple arguments', () => {
    expect(Parser.parse('min(1, 3)')).toEqual(1);
  });
  test('Parser should parse hard cases', () => {
    expect(Parser.parse('( 2 + 3 ) - 5 * sin ( 3 * 7 )')).toEqual(
      2 + 3 - 5 * Math.sin(3 * 7),
    );
    expect(Parser.parse('1 + 2 + 3 * 4')).toEqual(1 + 2 + 3 * 4);
  });
  test('Parser should throw on unexpected character', () => {
    expect(() => Parser.parse('sin(1)@')).toThrow('Unexpected character @');
  });
  test('Parser should throw on syntax error', () => {
    expect(() => Parser.parse('sin 1')).toThrow(
      'Expected LPAREN but got NUMBER (1)',
    );
    expect(() => Parser.parse('sin(1')).toThrow('Expected RPAREN but got EOF');
    expect(() => Parser.parse('(1)(2)')).toThrow('but got LPAREN');
  });
});
