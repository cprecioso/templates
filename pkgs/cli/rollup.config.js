// @ts-check

import { synthesizeTemplates } from "@pkg/tpl-zip"
import nodeResolve from "@rollup/plugin-node-resolve"
import virtual from "@rollup/plugin-virtual"
import ts from "@wessberg/rollup-plugin-ts"
import path from "path"
import pkg from "./package.json"

/** @type {(template: TemplateStringsArray, ...substitutions: any[]) => import("@yarnpkg/fslib").PortablePath} */
const r = (...args) =>
  /** @type {import("@yarnpkg/fslib").PortablePath} */ (path.resolve(
    __dirname,
    String.raw(...args)
  ))

export default (async () =>
  /** @type {import("rollup").RollupOptions} */ ({
    input: r`src/index.ts`,
    output: { file: "dist/index.mjs", format: "esm" },
    plugins: [
      virtual({
        "@template/all": `export default (${JSON.stringify(
          await synthesizeTemplates(__dirname)
        )});`,
      }),
      nodeResolve({ modulesOnly: true }),
      ts({ typescript: require("typescript") }),
    ],
    external: [
      ...require("module").builtinModules,
      ...Object.keys(pkg.dependencies || {}),
    ],
    treeshake: {
      moduleSideEffects: "no-external",
    },
  }))()
