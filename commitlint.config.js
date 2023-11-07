module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [1, 'always', ['sentence-case']],
    'header-max-length': [1, 'always', 72]
  }
};
