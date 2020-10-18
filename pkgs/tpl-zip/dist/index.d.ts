type FileInfo = {
    fileName: string;
    contents: string;
};
type TemplateInfo = {
    templateName: string;
    files: FileInfo[];
};
declare const synthesizeTemplates: (_basePath: string) => Promise<TemplateInfo[]>;
declare const unsynthesizeTemplate: (basePath: string, { files }: TemplateInfo) => Promise<void[]>;
export { FileInfo, TemplateInfo, synthesizeTemplates, unsynthesizeTemplate };
