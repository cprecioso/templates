import yarn from "@yarnpkg/core"
import type { PortablePath } from "@yarnpkg/fslib"
import fs from "fs/promises"
import globby from "globby"
import path from "path"

export type FileInfo = { fileName: string; contents: string }
export type TemplateInfo = { templateName: string; files: FileInfo[] }

const ENCODING: BufferEncoding = "base64"

export const synthesizeTemplates = async (
  _basePath: string
): Promise<TemplateInfo[]> => {
  const basePath = _basePath as PortablePath

  const configuration = await yarn.Configuration.find(basePath, null, {
    strict: false,
  })
  const { project } = await yarn.Project.find(configuration, basePath)

  const templates = project.workspaces
    .filter((ws) => ws.manifest.name?.scope === "template")
    .map((ws) => ({ templateName: ws.manifest.name!.name, cwd: ws.cwd }))

  return await Promise.all(
    templates.map(async ({ templateName: templateName, cwd }) => {
      const files: FileInfo[] = []

      for await (const file of globby.stream("**/*", {
        cwd,
        absolute: true,
        gitignore: true,
      })) {
        files.push({
          fileName: path.relative(cwd, file as string),
          contents: await fs.readFile(file, ENCODING),
        })
      }

      files.push({
        fileName: ".gitignore",
        contents: await fs.readFile(path.resolve(cwd, ".gitignore"), ENCODING),
      })

      return { templateName, files }
    })
  )
}

export const unsynthesizeTemplate = async (
  basePath: string,
  { files }: TemplateInfo
) =>
  await Promise.all(
    files.map(async ({ fileName, contents }) => {
      const fullPath = path.join(basePath, fileName)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, contents, ENCODING)
    })
  )
