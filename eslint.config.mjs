import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextConfigPath = require.resolve("eslint-config-next");
const nextRequire = createRequire(nextConfigPath);

const nextPlugin = nextRequire("@next/eslint-plugin-next");
const tsParser = nextRequire("@typescript-eslint/parser");
const tsPlugin = nextRequire("@typescript-eslint/eslint-plugin");
const reactPlugin = nextRequire("eslint-plugin-react");

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/no-unescaped-entities": "warn",
      "prefer-const": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Keep existing repository-wide unused-code debt non-blocking while reporting it.
      "@typescript-eslint/no-unused-vars": "warn",
      // Existing repository-wide lint debt is warnings; new code should avoid this pattern.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
