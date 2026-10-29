import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // React Compiler rules from eslint-plugin-react-hooks@7 — keep classic
      // hooks linting; defer a Compiler compliance pass.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      // OAuth / hard navigation still needs full document loads.
      "@next/next/no-location-assign-relative-destination": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "gsap/SplitText",
              message:
                "SplitText rewrites the DOM and caused React #418 hydration failures. Animate whole nodes instead.",
            },
            {
              name: "@gsap/react",
              message:
                "useGSAP uses useLayoutEffect and races React Flight streaming. Use useMotionEffect from @/lib/hooks.",
            },
          ],
          patterns: [
            {
              group: ["gsap/SplitText", "gsap/dist/SplitText"],
              message:
                "SplitText rewrites the DOM and caused React #418 hydration failures. Animate whole nodes instead.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
