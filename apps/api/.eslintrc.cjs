module.exports = {
  root: true,
  env: {
    node: true,
    es2023: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  ignorePatterns: [
    "dist/",
    "node_modules/",
    ".eslintrc.cjs",
  ],
  overrides: [
    {
      files: ["src/**/*.service.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
      },
    },
  ],
};
