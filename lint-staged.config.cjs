module.exports = {
  '*.{js,jsx}': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,md,css,html,yml,yaml,cjs,mjs}': ['prettier --write'],
};
