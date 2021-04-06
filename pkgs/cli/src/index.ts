#!/usr/bin/env node

import { unsynthesizeTemplate } from "@pkg/tpl-zip"
import templates from "@template/all"
import execa from "execa"
import fs from "fs/promises"
import inquirer from "inquirer"
import Listr from "listr"
import path from "path"
import semver from "semver"
import type stream from "stream"
import { transformedInput } from "./input"
import { resolvePkgName } from "./pkgName"

void (async () => {
  const { cwd } = await inquirer.prompt(
    transformedInput("cwd", path.resolve, process.cwd())
  )

  const { packageName, templateName, enablePnp } = await inquirer.prompt([
    transformedInput("packageName", resolvePkgName, path.basename(cwd)),
    {
      name: "templateName",
      type: "list",
      choices: Object.keys(templates),
    },
    { name: "enablePnp", type: "confirm" },
  ])

  const exec = (program: string, args: string[]) =>
    execa(program, args, { cwd }).stdout as stream.Readable

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
      skip: async () =>
        semver.satisfies(
          semver.coerce((await execa("yarn", ["--version"], { cwd })).stdout)!,
          ">=2"
        ),
      task: () => {
        return new Listr([
          {
            title: "Downloading yarn",
            task: () => exec("yarn", ["set", "version", "berry"]),
          },
          {
            title: "Persisting yarn",
            task: () => exec("yarn", ["set", "version", "berry"]),
          },
        ])
      },
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
                      exec("yarn", ["plugin", "import", "typescript"]),
                  },
                ]),
            },
            {
              title: "Setting up node linker",
              task: () =>
                exec("yarn", [
                  "config",
                  "set",
                  "nodeLinker",
                  enablePnp ? "pnp" : "node-modules",
                ]),
            },
          ],
          { concurrent: true }
        ),
    },
    {
      title: "Installing dependencies",
      task: () => exec("yarn", []),
    },
    {
      title: "Persisting ranges",
      task: () => exec("yarn", ["up", "-C", "**"]),
    },
    {
      title: "PnPifying SDKs",
      skip: () => !enablePnp,
      task: () => exec("yarn", ["dlx", "@yarnpkg/pnpify", "--sdk", "vscode"]),
    },
    { title: "Initializing git", task: () => exec("git", ["init"]) },
    {
      title: "Formatting",
      task: () => exec("yarn", ["run", "format"]),
    },
    { title: "Adding files", task: () => exec("git", ["add", "."]) },
    {
      title: "Committing",
      task: () => exec("git", ["commit", "-m", "Initial commit"]),
    },
  ]).run()
})().catch((err) => console.error(err))
