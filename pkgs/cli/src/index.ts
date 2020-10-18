import { unsynthesizeTemplate } from "@pkg/tpl-zip"
import templates from "@template/all"
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
    default: process.cwd(),
  })

  const { packageName } = await inquirer.prompt([
    {
      name: "packageName",
      type: "input",
      transformer: (t: string) => t.toLowerCase(),
      default: path.basename(cwd),
    },
  ])

  const { templateName } = await inquirer.prompt({
    name: "templateName",
    type: "list",
    choices: Object.keys(templates),
  })

  const working1 = (async () => {
    await unsynthesizeTemplate(cwd, await templates[templateName]())

    const pkg = JSON.parse(
      await fs.readFile(path.resolve(cwd, "package.json"), "utf-8")
    )
    pkg.name = packageName
    await fs.writeFile(
      path.resolve(cwd, "package.json"),
      JSON.stringify(pkg, null, 2)
    )
  })()

  const { enablePnp } = await inquirer.prompt([
    {
      name: "enablePnp",
      type: "confirm",
      default: false,
    },
  ])

  await working1

  await execa("yarn", ["set", "version", "berry"], {
    stdout: "inherit",
    cwd,
  })
  await execa("yarn", ["plugin", "import", "typescript"], {
    stdout: "inherit",
    cwd,
  })

  if (enablePnp) {
    await addToGitIgnore(cwd, [".pnp.*"])
  } else {
    await fs.appendFile(
      path.resolve(cwd, ".yarnrc.yml"),
      "\nnodeLinker: node-modules\n"
    )
  }

  await execa("yarn", { stdout: "inherit", cwd })
  await execa("yarn", ["up", "-C", "**"], { stdout: "inherit", cwd })

  console.log("Done")
})().catch((err) => console.error(err))
