// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import reactHooks from "eslint-plugin-react-hooks";

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [js.configs.recommended, ...tseslint.configs.recommended, {
  ignores: [
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "dist/**",
    ".storybook/**",
    "storybook-static/**",
    "coverage/**",
    "public/**",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
    "scripts/**",
    "lighthouserc.js",
    "next-env.d.ts"
  ]
}, {
  languageOptions: {
    globals: {
      console: "readonly",
      module: "readonly",
      require: "readonly",
      __dirname: "readonly",
      process: "readonly",
      Buffer: "readonly",
      NodeJS: "readonly"
    }
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/triple-slash-reference": "off",
    "no-case-declarations": "warn",
    "prefer-const": "warn",
    "no-undef": "off", // TypeScript handles this
    "no-control-regex": "warn" // Allow control characters in regex when needed (with disable comment)
  }
}, {
  plugins: {
    "react-hooks": reactHooks
  },
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}, ...storybook.configs["flat/recommended"]];
