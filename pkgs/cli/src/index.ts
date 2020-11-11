#!/usr/bin/env node

import { unsynthesizeTemplate } from "@pkg/tpl-zip"
import templates from "@template/all"
import chalk from "chalk"
import execa from "execa"
import fs from "fs/promises"
import inquirer from "inquirer"
import path from "path"

const addToGitIgnore = async (cwd: string, entries: string[]) => {
  const file = path.resolve(cwd, ".gitignore")
  await fs.appendFile(file, `\n` + entries.join("\n") + "\n")
}

void (async () => {
  const { cwd } = await inquirer.prompt({
    name: "cwd",
    type: "input",
    transformer: (p: string) =>
      path.isAbsolute(p)
        ? p
        : chalk`{dim (${path.resolve(process.cwd(), p)})} ${p}`,
    filter: (p: string) => path.resolve(process.cwd(), p),
  })

  const { packageName } = await inquirer.prompt({
    name: "packageName",
    type: "input",
    transformer: (t: string) => t.toLowerCase(),
    filter: (t: string) => t.toLowerCase(),
    default: path.basename(cwd),
  })

  const { templateName } = await inquirer.prompt({
    name: "templateName",
    type: "list",
    choices: Object.keys(templates),
  })

  const status = (s: string) => process.stdout.write(s + "... ")
  const done = () => process.stdout.write(chalk`{green.dim Done!}\n`)

  status("Unpacking template")
  await unsynthesizeTemplate(cwd, await templates[templateName]())
  done()

  status("Adapting template to project")
  const pkg = JSON.parse(
    await fs.readFile(path.resolve(cwd, "package.json"), "utf-8")
  )
  pkg.name = packageName

  status("Adding code formatters")
  {
    /** Add prettier and precommit hooks */
    Object.assign((pkg.devDependencies ||= {}), {
      prettier: "*",
      "pretty-quick": "*",
      husky: "*",
      "sort-package-json": "*",
    })
    ;((pkg.husky ||= {}).hooks ||= {})["pre-commit"] = "yarn run format"
    ;(pkg.scripts ||= {}).format = "sort-package-json; pretty-quick --staged"

    await fs.writeFile(
      path.resolve(cwd, ".prettierrc"),
      JSON.stringify({ semi: false }, null, 2)
    )
  }

  await fs.writeFile(
    path.resolve(cwd, "package.json"),
    JSON.stringify(pkg, null, 2)
  )
  done()

  console.log("Installing yarn")
  await execa("yarn", ["set", "version", "berry", "--only-if-needed"], {
    stdout: "inherit",
    cwd,
  })

  console.log("Importing typescript plugin")
  const hasTypeScriptPlugin = (
    await execa("yarn", ["plugin", "runtime", "--json"], { cwd })
  ).stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line.trim()))
    .some((plugin) => plugin.name === "@yarnpkg/plugin-typescript")

  if (!hasTypeScriptPlugin) {
    await execa("yarn", ["plugin", "import", "typescript"], {
      stdout: "inherit",
      cwd,
    })
  }

  console.log("Setting up node-modules linker")
  await execa("yarn", ["config", "set", "nodeLinker", "node-modules"], {
    stdout: "inherit",
    cwd,
  })

  console.log("Installing dependencies")
  await execa("yarn", { stdout: "inherit", cwd })

  console.log("Persisting ranges")
  await execa("yarn", ["up", "-C", "**"], { stdout: "inherit", cwd })

  console.log("Formatting")
  await execa("yarn", ["run", "format"], { stdout: "inherit", cwd })

  console.log("Done")
})().catch((err) => console.error(err))
