import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig, globalIgnores } from "eslint/config";

const DIRECTIVE_PATTERN =
  /^(eslint-disable|eslint-disable-line|eslint-disable-next-line|eslint-enable)\b/;

const JUSTIFICATION_PATTERN = /\s--\s+\S/;

const ORDER_PATTERN = /^order:\s+\S/;

const noCommentsRule = {
  create(context) {
    const enforceBlockComment = (comment) => {
      if (comment.type !== "Line") {
        return;
      }
      context.report({
        fix: comment.value.includes("*/")
          ? undefined
          : (fixer) =>
              fixer.replaceTextRange(comment.range, `/*${comment.value} */`),
        loc: comment.loc,
        messageId: "lineComment",
      });
    };

    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const text = comment.value.trim();
          if (text.startsWith("@ts-expect-error") || ORDER_PATTERN.test(text)) {
            enforceBlockComment(comment);
            continue;
          }
          if (DIRECTIVE_PATTERN.test(text)) {
            if (
              !text.startsWith("eslint-enable") &&
              !JUSTIFICATION_PATTERN.test(text)
            ) {
              context.report({
                loc: comment.loc,
                messageId: "missingJustification",
              });
              continue;
            }
            enforceBlockComment(comment);
            continue;
          }
          context.report({ loc: comment.loc, messageId: "forbidden" });
        }
      },
    };
  },
  meta: {
    fixable: "code",
    messages: {
      forbidden:
        "Comments are forbidden. Allowed forms, each written as a /* */ block comment: an eslint-disable directive with a '-- justification', 'order: <reason>' justifying a semantic sequence, or @ts-expect-error with a description.",
      lineComment:
        "Line comments (//) are forbidden. Use a /* */ block comment instead.",
      missingJustification:
        "eslint-disable directives require a justification: append '-- <reason>'.",
    },
    schema: [],
    type: "problem",
  },
};

const petPlugin = {
  rules: { "no-comments": noCommentsRule },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
    plugins: { perfectionist, pet: petPlugin, unicorn },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message: "Relative imports are forbidden. Use the @/ alias.",
            },
          ],
        },
      ],
      "perfectionist/sort-classes": "error",
      "perfectionist/sort-enums": "error",
      "perfectionist/sort-exports": "error",
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            ["side-effect", "side-effect-style"],
            ["value-builtin", "value-external"],
            "value-internal",
            ["type-import", "type-internal"],
            "unknown",
          ],
        },
      ],
      "perfectionist/sort-interfaces": "error",
      "perfectionist/sort-jsx-props": "error",
      "perfectionist/sort-maps": "error",
      "perfectionist/sort-named-exports": "error",
      "perfectionist/sort-named-imports": "error",
      "perfectionist/sort-object-types": "error",
      "perfectionist/sort-objects": "error",
      "perfectionist/sort-union-types": "error",
      "pet/no-comments": "error",
      "react/no-multi-comp": ["error", { ignoreStateless: false }],
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
    },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
