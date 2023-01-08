/** @type {import('ts-jest').JestConfigWithTsJest} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  modulePathIgnorePatterns: [
    '<rootDir>/src/__test__/calculator/lexer/lexer.ts',
    '<rootDir>/dist',
    '<rootDir>/src/__test__/calculator/parser/lexer.ts',
    '<rootDir>/src/__test__/calculator/parser/parser.ts'
  ],
  moduleFileExtensions: ['js', 'ts', 'pegjs', 'peggier'],
};
