import { antfu } from "@antfu/eslint-config";
import depend from "eslint-plugin-depend";
import sonarjs from "eslint-plugin-sonarjs";


export default antfu(
    {
        stylistic: {
            quotes: "double",
            indent: 4,
            semi: true,
        },
        rules: {
            "yaml/indent": ["warn", 4, { indicatorValueIndent: 2 }],
            "style/arrow-parens": ["warn", "always"],
            "style/operator-linebreak": ["off"],
            "style/brace-style": ["warn", "1tbs"],
            "style/quote-props": ["error", "as-needed"],
        },
    },
    {
        plugins: {
            depend,
            sonarjs,
        },
        rules: {
            "depend/ban-dependencies": "error",
            ...sonarjs.configs.recommended.rules,
        },
    },
);