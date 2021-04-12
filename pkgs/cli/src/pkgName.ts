import slugify from "@sindresorhus/slugify"

export const extractPkgName = (input: string) => {
  if (input.startsWith("@")) {
    const slashIndex = input.indexOf("/")
    return slashIndex > 0
      ? {
          scope: input.slice(1, slashIndex),
          pkgName: input.slice(slashIndex + 1),
        }
      : { scope: input.slice(1) }
  } else {
    return { pkgName: input }
  }
}

const slugifyOptions: slugify.Options = { decamelize: true, lowercase: true }

export const resolvePkgName = (initial: string, input: string) => {
  let { scope, pkgName } = extractPkgName(input)
  if (scope) scope = slugify(scope, slugifyOptions)
  pkgName = slugify(pkgName || initial, slugifyOptions)
  return (scope ? `@${scope}/` : "") + pkgName
}
