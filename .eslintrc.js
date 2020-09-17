module.exports = {
  extends: ['plugin:@xcritical/eslint-plugin-xcritical/base'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js'],
      },
    },
  },
  rules: {
    'no-console': [1, {
      allow: ['error'],
    }],
    'prefer-destructuring': ['error', {
      array: false,
      object: true,
    }, {
      enforceForRenamedProperties: false,
    }],
  },
};
