declare module "@template/all" {
  import { TemplateInfo } from "@pkg/tpl-zip"

  declare const data: Record<string, () => Promise<TemplateInfo>>
  export default data
}
