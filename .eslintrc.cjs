/* eslint-env node */
try {
  require('@rushstack/eslint-patch/modern-module-resolution');
} catch {
  // Optional in this skeleton: don't hard-fail if ESLint deps are not installed yet.
}

const hasModule = (moduleName) => {
  try {
    require.resolve(moduleName);
    return true;
  } catch {
    return false;
  }
};

const extendIfInstalled = (moduleName, extendName = moduleName) => {
  return hasModule(moduleName) ? [extendName] : [];
};

const off = 'off';
const warn = 'warn';
const error = 'error';

const never = 'never';
const always = 'always';
const asNeeded = 'as-needed';
const all = 'all';
const consistent = 'consistent';
const consistentAsNeeded = 'consistent-as-needed';
const single = 'single';
const last = 'last';
const beside = 'beside';
const preferSingle = 'prefer-single';
const unix = 'unix';
const inside = 'inside';
const anywhere = 'anywhere';
const exceptParens = 'except-parens';
const property = 'property';
const multiLine = 'multi-line';
const smart = 'smart';
const none = 'none';
const alwaysMultiline = 'always-multiline';

const rulesError = {
  'for-direction': [error],
  'getter-return': [error],
  'no-await-in-loop': [error],
  'no-compare-neg-zero': [error],
  'no-cond-assign': [error],
  'no-console': [off],
  'no-control-regex': [error],
  'no-debugger': [off],
  'no-dupe-args': [error],
  'no-dupe-keys': [error],
  'no-duplicate-case': [error],
  'no-empty': [error],
  'no-empty-character-class': [error],
  'no-ex-assign': [error],
  'no-extra-boolean-cast': [/*error*/ off],
  'no-extra-parens': [/*error*/ off, all, { nestedBinaryExpressions: false }],
  'no-func-assign': [error],
  'no-invalid-regexp': [error],
  'no-obj-calls': [error],
  'no-regex-spaces': [error],
  'no-sparse-arrays': [error],
  'no-template-curly-in-string': [error],
  'no-unexpected-multiline': [error],
  'no-unreachable': [error],
  'no-unsafe-finally': [error],
  'no-unsafe-negation': [error],
  'use-isnan': [error],
  'valid-typeof': [error],
  'accessor-pairs': [error],
  'array-callback-return': [error],
  'block-scoped-var': [error],
  'class-methods-use-this': [off],
  'consistent-return': [/*error*/ off],
  'default-case': [error],
  'dot-location': [error, property],
  'no-alert': [error],
  'no-caller': [error],
  'no-case-declarations': [error],
  'no-empty-pattern': [error],
  'no-extra-bind': [error],
  'no-extra-label': [error],
  'no-fallthrough': [error],
  'no-floating-decimal': [error],
  'no-global-assign': [error],
  'no-implicit-coercion': [error],
  'no-invalid-this': [off],
  'no-iterator': [error],
  'no-labels': [error],
  'no-lone-blocks': [error],
  'no-loop-func': [error],
  'no-multi-str': [error],
  'no-new-func': [error],
  'no-new-wrappers': [error],
  'no-octal': [error],
  'no-octal-escape': [error],
  'no-proto': [error],
  'no-redeclare': [error],
  'no-restricted-properties': [error],
  'no-return-await': [/*error*/ off],
  'no-self-assign': [error],
  'no-self-compare': [error],
  'no-sequences': [error],
  'no-unused-expressions': [
    error,
    { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true }
  ],
  'no-unused-labels': [error],
  'no-useless-call': [error],
  'no-useless-concat': [error],
  'no-useless-escape': [error],
  'no-void': [error],
  'no-with': [error],
  'radix': [error, asNeeded],
  'require-await': [/*error*/ off],
  'no-catch-shadow': [error],
  'no-delete-var': [error],
  'no-label-var': [error],
  'no-restricted-globals': [error],
  'no-shadow': [/*error*/ off],
  'no-shadow-restricted-names': [error],
  'no-undef': [off],
  'no-undef-init': [error],
  'no-unused-vars': [/*error*/ warn, { args: none, vars: all }],
  'no-use-before-define': [error, { functions: false, classes: true }],
  'callback-return': [/*error*/ warn, ['callback', 'cb', 'next']],
  'handle-callback-err': [error],
  'no-buffer-constructor': [error],
  'no-new-require': [error],
  'no-path-concat': [error],
  'constructor-super': [error],
  'no-class-assign': [error],
  'no-confusing-arrow': [error],
  'no-const-assign': [error],
  'no-dupe-class-members': [error],
  'no-duplicate-imports': [error],
  'no-new-symbol': [error],
  'no-restricted-imports': [error],
  'no-this-before-super': [error],
  'no-useless-computed-key': [error],
  'no-useless-constructor': [error],
  'no-useless-rename': [error],
  'symbol-description': [error]
};

const rulesWarn = {
  'no-constant-condition': [/*warn*/ off],
  'no-extra-semi': [/*warn*/ off],
  'curly': [
    /*warn*/ off,
    /*
     * 'all',           // 无论什么情况，都需要带括号
     *
     * 只有single statement可以不带括号，否则是语法错误。
     * single statement有4种：a)一行的statement，b)一行的statement但前后有注释，c)if,else,for,while,do的statement是一个单行的if,else,for,while,do statement，d)if,else,for,while,do的statement是一个多行的if,else,for,while,do statement
     * 'multi',         // 多个statement必须带  - a) b) c) d)可以不带
     * 'multi-line',    // 与关键字不在一行必须带 - a) c)而且必须在同一行，可以不带
     * 'multi-or-nest', // 多行的嵌入必须带      - a) b) c) 如果是一行，可以不带
     */
    multiLine,
    consistent
  ],
  'eqeqeq': [/*warn*/ off, smart],
  'guard-for-in': [/*warn*/ off],
  'no-div-regex': [/*warn*/ off],
  'no-else-return': [/*warn*/ off, { allowElseIf: false }],
  'no-empty-function': [off],
  'no-eval': [warn],
  'no-extend-native': [warn],
  'no-implicit-globals': [warn],
  'no-implied-eval': [/*warn*/ off],
  'no-inner-declarations': [/*warn*/ off],
  'no-new': [warn],
  'no-param-reassign': [/*warn*/ off],
  'no-return-assign': [/*warn*/ off, exceptParens],
  'no-script-url': [warn],
  'no-throw-literal': [/*warn*/ off],
  'no-unmodified-loop-condition': [warn],
  'no-useless-return': [/*warn*/ off],
  'no-warning-comments': [
    /*warn*/ off,
    { location: anywhere, terms: ['todo', 'fix'] }
  ],
  'prefer-promise-reject-errors': [/*warn*/ off],
  'wrap-iife': [/*warn*/ off, inside, { functionPrototypeMethods: true }],
  'no-process-exit': [/*warn*/ off],
  'no-restricted-modules': [/*warn*/ off, 'assert', 'async', 'inspect', 'util'],
  'no-sync': [/*warn*/ off],
  'arrow-body-style': [/*warn*/ off, asNeeded],
  'arrow-parens': [/*warn*/ off, asNeeded],
  'no-var': [/*warn*/ off],
  'object-shorthand': [off, consistent],
  'prefer-arrow-callback': [off],
  'prefer-const': [/*warn*/ off],
  'prefer-numeric-literals': [/*warn*/ off],
  'prefer-rest-params': [/*warn*/ off],
  'prefer-spread': [/*warn*/ off],
  'prefer-template': [/*warn*/ off],
  'require-yield': [warn]
};

const rulesOff = {
  'complexity': [off],
  'no-irregular-whitespace': [off],
  'no-prototype-builtins': [off],
  'valid-jsdoc': [off],
  'dot-notation': [off],
  'no-eq-null': [off],
  'no-magic-numbers': [off],
  'no-multi-spaces': [off],
  'vars-on-top': [off],
  'yoda': [off],
  'strict': [off],
  'init-declarations': [off],
  'no-undefined': [off],
  'global-require': [off],
  'no-mixed-requires': [off],
  'no-process-env': [off],
  'arrow-spacing': [off],
  'generator-star-spacing': [off],
  'rest-spread-spacing': [off],
  'sort-imports': [off],
  'template-curly-spacing': [off],
  'yield-star-spacing': [off]
};

const ruleStyle = {
  'array-bracket-newline': [off],
  'array-bracket-spacing': [off],
  'array-element-newline': [off],
  'block-spacing': [off],
  'brace-style': [/*warn*/ off, '1tbs', { allowSingleLine: true }],
  'camelcase': [off],
  'capitalized-comments': [off],
  'comma-dangle': [/*warn*/ error, alwaysMultiline],
  'comma-spacing': [/*warn*/ off],
  'comma-style': [warn, last],
  'computed-property-spacing': [/*warn*/ off, never],
  'consistent-this': [off, 'that'],
  'eol-last': [warn, always],
  'func-call-spacing': [off],
  'func-name-matching': [/*warn*/ off, always],
  'func-names': [/*warn*/ off, asNeeded],
  'func-style': [off],
  'function-paren-newline': [warn, consistent],
  'id-blacklist': [off],
  'id-length': [off],
  'id-match': [off],
  'implicit-arrow-linebreak': [/*warn*/ off, beside],
  'indent': [off, 2],
  'jsx-quotes': [off, preferSingle],
  'key-spacing': [off],
  'keyword-spacing': [off],
  'line-comment-position': [off, { position: beside }],
  'linebreak-style': [error, unix],
  'lines-around-comment': [off],
  'lines-between-class-members': [off],
  'max-depth': [off],
  'max-len': [off],
  'max-lines': [off],
  'max-nested-callbacks': [off],
  'max-params': [off],
  'max-statements': [off],
  'max-statements-per-line': [off],
  'multiline-comment-style': [off],
  'multiline-ternary': [off],
  'new-cap': [off],
  'new-parens': [warn],
  'newline-per-chained-call': [/*warn*/ off, { ignoreChainWithDepth: 5 }],
  'no-array-constructor': [error],
  'no-bitwise': [error, { allow: ['~', '&', '>>'], int32Hint: true }],
  'no-continue': [off],
  'no-inline-comments': [off],
  'no-lonely-if': [off],
  'no-mixed-operators': [off],
  'no-mixed-spaces-and-tabs': [error],
  'no-multi-assign': [/*warn*/ off],
  'no-multiple-empty-lines': [error, { max: 1, maxBOF: 0, maxEOF: 0 }],
  'no-negated-condition': [off],
  'no-nested-ternary': [off],
  'no-new-object': [error],
  'no-plusplus': [off],
  'no-restricted-syntax': [off],
  'no-tabs': [off],
  'no-ternary': [off],
  'no-trailing-spaces': [error],
  'no-underscore-dangle': [off],
  'no-unneeded-ternary': [error],
  'no-whitespace-before-property': [/*warn*/ off],
  'nonblock-statement-body-position': [error, beside],
  'object-curly-newline': [off],
  'object-curly-spacing': [off],
  'object-property-newline': [off],
  'one-var': [off],
  'one-var-declaration-per-line': [off],
  'operator-assignment': [off],
  'operator-linebreak': [off],
  'padded-blocks': [/*warn*/ off, never],
  'padding-line-between-statements': [off],
  'prefer-destructuring': [off],
  'quote-props': [
    warn,
    consistentAsNeeded,
    { keywords: false, numbers: true, unnecessary: true }
  ],
  'quotes': [error, single, { allowTemplateLiterals: true, avoidEscape: true }],
  'require-jsdoc': [off],
  'semi': [/*warn*/ off, never, { beforeStatementContinuationChars: always }],
  'semi-spacing': [off],
  'semi-style': [off],
  'sort-keys': [off],
  'sort-vars': [off],
  'space-before-blocks': [off],
  'space-before-function-paren': [off],
  'space-in-parens': [off],
  'space-infix-ops': [off],
  'space-unary-ops': [off],
  'spaced-comment': [off],
  'switch-colon-spacing': [off],
  'template-tag-spacing': [off],
  'unicode-bom': [error, never],
  'wrap-regex': [off]
};

const config = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/'],
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    ...extendIfInstalled('eslint-plugin-vue', 'plugin:vue/vue3-essential'),
    ...extendIfInstalled('@vue/eslint-config-typescript'),
    ...extendIfInstalled('@vue/eslint-config-prettier', '@vue/eslint-config-prettier/skip-formatting')
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    ...rulesOff,
    ...rulesWarn,
    ...rulesError,
    'vue/require-prop-types': [off],
    'vue/require-v-for-key': [warn],
    'vue/valid-v-for': [warn],
    'vue/max-attributes-per-line': [off],
    'vue/html-self-closing': [off],
    'vue/no-v-html': [off],
    'vue/no-eval': [off],
    '@typescript-eslint/no-namespace': [off],
    '@typescript-eslint/no-inferrable-types': [off],
    '@typescript-eslint/no-empty-interface': [off],
    '@typescript-eslint/camelcase': [off],
    '@typescript-eslint/no-explicit-any': [off],
    '@typescript-eslint/class-name-casing': [off],
    '@typescript-eslint/ban-types': [off],
    'vue/html-indent': [off],
    '@typescript-eslint/no-this-alias': [off],
    'vue/singleline-html-element-content-newline': [off],
    'no-eval': [off],
    'vue/multi-word-component-names': [off],
    '@typescript-eslint/ban-ts-comment': [off]
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
};

module.exports = config;
