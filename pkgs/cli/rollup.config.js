// @ts-check

import { synthesizeTemplates } from "@pkg/tpl-zip"
import nodeResolve from "@rollup/plugin-node-resolve"
import virtual from "@rollup/plugin-virtual"
import ts from "@wessberg/rollup-plugin-ts"
import path from "path"
import shebang from "rollup-plugin-preserve-shebang"
import pkg from "./package.json"

/** @type {(template: TemplateStringsArray, ...substitutions: any[]) => import("@yarnpkg/fslib").PortablePath} */
const r = (...args) =>
  /** @type {import("@yarnpkg/fslib").PortablePath} */ (path.resolve(
    __dirname,
    String.raw(...args)
  ))

export default (async () => /** @type {import("rollup").RollupOptions} */ {
  const templates = await synthesizeTemplates(__dirname)

  return /** @type {import("rollup").RollupOptions} */ ({
    input: r`src/index.ts`,
    output: {
      dir: "dist",
      format: "cjs",
      entryFileNames: "[name].js",
      chunkFileNames: "template-[name].js",
    },
    plugins: [
      shebang(),
      virtual({
        ...Object.fromEntries(
          templates.map((template) => [
            `@template/${template.templateName}`,
            `export default (${JSON.stringify(template)});`,
          ])
        ),
        "@template/all": `export default ({${templates
          .map(
            (template) =>
              `${template.templateName}: async () => (await import("@template/${template.templateName}")).default`
          )
          .join(", ")}});`,
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
  })
})()
