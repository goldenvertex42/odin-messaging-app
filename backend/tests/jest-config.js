import path from 'path';

export default {
  testEnvironment: 'node',
  transform: {},
  rootDir: path.resolve(process.cwd()),
  setupFiles: ['<rootDir>/tests/jest-setup.js'],
  forceExit: true
};
