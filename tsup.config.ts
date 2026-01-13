import { defineConfig } from "tsup";

export default defineConfig({
    format: ["cjs", "esm"],
    outDir: "dist",
    clean: true,
    dts: true,
    entry: ["src/index.ts"],
    outExtension({ format }) {
        if (format === "esm") {
            return {
                js: ".mjs",
                dts: ".d.mts",
            };
        }

        if (format === "cjs") {
            return {
                js: ".cjs",
                dts: ".d.cts",
            };
        }

        return {
            js: ".js",
            dts: ".d.ts",
        };
    },
});
