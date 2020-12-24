#!/usr/bin/env node

import { unsynthesizeTemplate } from "@pkg/tpl-zip"
import templates from "@template/all"
import chalk from "chalk"
import execa from "execa"
import fs from "fs/promises"
import inquirer from "inquirer"
import Listr from "listr"
import path from "path"

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

  const { packageName, templateName } = await inquirer.prompt([
    {
      name: "packageName",
      type: "input",
      transformer: (t: string) => t.toLowerCase(),
      filter: (t: string) => t.toLowerCase(),
      default: path.basename(cwd),
    },
    {
      name: "templateName",
      type: "list",
      choices: Object.keys(templates),
    },
  ])

  await new Listr([
    {
      title: "Unpacking template",
      task: async () =>
        unsynthesizeTemplate(cwd, await templates[templateName]()),
    },
    {
      title: "Adapting template to project",
      task: async () => {
        const pkg = JSON.parse(
          await fs.readFile(path.resolve(cwd, "package.json"), "utf-8")
        )

        pkg.name = packageName

        /** Add prettier and precommit hooks */
        Object.assign((pkg.devDependencies ||= {}), {
          prettier: "*",
          "pretty-quick": "*",
          husky: "*",
          "sort-package-json": "*",
        })
        ;((pkg.husky ||= {}).hooks ||= {})["pre-commit"] = "yarn run format"
        ;(pkg.scripts ||= {}).format =
          "sort-package-json; pretty-quick --staged"

        await Promise.all([
          fs.writeFile(
            path.resolve(cwd, ".prettierrc"),
            JSON.stringify({ semi: false }, null, 2)
          ),
          fs.writeFile(
            path.resolve(cwd, "package.json"),
            JSON.stringify(pkg, null, 2)
          ),
        ])
      },
    },
    {
      title: "Installing yarn",
      task: () =>
        execa("yarn", ["set", "version", "berry", "--only-if-needed"], { cwd }),
    },
    {
      title: "Setting up yarn",
      task: () =>
        new Listr(
          [
            {
              title: "Importing typescript plugin",
              task: () =>
                new Listr([
                  {
                    title: "Checking if already installed",
                    task: async (ctx) => {
                      const hasTypeScriptPlugin = (
                        await execa("yarn", ["plugin", "runtime", "--json"], {
                          cwd,
                        })
                      ).stdout
                        .trim()
                        .split("\n")
                        .map((line) => JSON.parse(line.trim()))
                        .some(
                          (plugin) =>
                            plugin.name === "@yarnpkg/plugin-typescript"
                        )

                      ctx.disableNext = hasTypeScriptPlugin
                    },
                  },
                  {
                    title: "Installing typescript plugin",
                    skip: (ctx) => ctx.disableNext,
                    task: () =>
                      execa("yarn", ["plugin", "import", "typescript"], {
                        cwd,
                      }),
                  },
                ]),
            },
            {
              title: "Setting up node-modules linker",
              task: () =>
                execa("yarn", ["config", "set", "nodeLinker", "node-modules"], {
                  cwd,
                }),
            },
          ],
          { concurrent: true }
        ),
    },
    {
      title: "Installing dependencies",
      task: () => execa("yarn", { cwd }),
    },
    {
      title: "Persisting ranges",
      task: () => execa("yarn", ["up", "-C", "**"], { cwd }),
    },
    { title: "Initializing git", task: () => execa("git", ["init"], { cwd }) },
    {
      title: "Formatting",
      task: () => execa("yarn", ["run", "format"], { cwd }),
    },
    { title: "Adding files", task: () => execa("git", ["add", "."], { cwd }) },
    {
      title: "Committing",
      task: () => execa("git", ["commit", "-m", "Initial commit"], { cwd }),
    },
  ]).run()
})().catch((err) => console.error(err))
