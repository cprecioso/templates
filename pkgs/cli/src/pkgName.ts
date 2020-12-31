import slugify from "@sindresorhus/slugify"

export const extractPkgName = (input: string) => {
  if (input.startsWith("@")) {
    const slashIndex = input.indexOf("/")
    return {
      scope: input.slice(1, slashIndex),
      pkgName: slashIndex > 0 ? input.slice(slashIndex) : "",
    }
  } else {
    return { pkgName: input }
  }
}

const slugifyOptions: slugify.Options = { decamelize: false, lowercase: true }
export const resolvePkgName = (initial: string, input: string) => {
  let { scope, pkgName } = extractPkgName(input)
  if (scope) scope = slugify(scope, slugifyOptions)
  pkgName = slugify(pkgName || initial, slugifyOptions)
  return (scope ? `@${scope}/` : "") + pkgName
}
