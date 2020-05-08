module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  transform: {
    '\\.ts$': 'ts-jest'
  },
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/.cache/unit'
};
