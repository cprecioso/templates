declare module "@template/all" {
  import { synthesizeTemplates } from "@pkg/tpl-zip"

  type UnPromise<T> = T extends Promise<infer U> ? U : T

  declare const data: UnPromise<ReturnType<typeof synthesizeTemplates>>
  export default data
}
