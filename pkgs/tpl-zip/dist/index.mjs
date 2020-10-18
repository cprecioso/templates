import yarn from '@yarnpkg/core';
import fs from 'fs/promises';
import globby from 'globby';
import path from 'path';

const ENCODING = "base64";
const synthesizeTemplates = async (_basePath) => {
    const basePath = _basePath;
    const configuration = await yarn.Configuration.find(basePath, null, {
        strict: false,
    });
    const { project } = await yarn.Project.find(configuration, basePath);
    const templates = project.workspaces
        .filter((ws) => ws.manifest.name?.scope === "template")
        .map((ws) => ({ templateName: ws.manifest.name.name, cwd: ws.cwd }));
    return await Promise.all(templates.map(async ({ templateName: templateName, cwd }) => {
        const files = [];
        for await (const file of globby.stream("**/*", {
            cwd,
            absolute: true,
        })) {
            files.push({
                fileName: path.relative(cwd, file),
                contents: await fs.readFile(file, ENCODING),
            });
        }
        return { templateName, files };
    }));
};
const unsynthesizeTemplate = async (basePath, { files }) => await Promise.all(files.map(async ({ fileName, contents }) => {
    const fullPath = path.join(basePath, fileName);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, contents, ENCODING);
}));

export { synthesizeTemplates, unsynthesizeTemplate };
