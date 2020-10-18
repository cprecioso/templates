'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var yarn = require('@yarnpkg/core');
var fs = require('fs/promises');
var globby = require('globby');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var yarn__default = /*#__PURE__*/_interopDefaultLegacy(yarn);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var globby__default = /*#__PURE__*/_interopDefaultLegacy(globby);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

const ENCODING = "base64";
const synthesizeTemplates = async (_basePath) => {
    const basePath = _basePath;
    const configuration = await yarn__default['default'].Configuration.find(basePath, null, {
        strict: false,
    });
    const { project } = await yarn__default['default'].Project.find(configuration, basePath);
    const templates = project.workspaces
        .filter((ws) => ws.manifest.name?.scope === "template")
        .map((ws) => ({ templateName: ws.manifest.name.name, cwd: ws.cwd }));
    return await Promise.all(templates.map(async ({ templateName: templateName, cwd }) => {
        const files = [];
        for await (const file of globby__default['default'].stream("**/*", {
            cwd,
            absolute: true,
        })) {
            files.push({
                fileName: path__default['default'].relative(cwd, file),
                contents: await fs__default['default'].readFile(file, ENCODING),
            });
        }
        return { templateName, files };
    }));
};
const unsynthesizeTemplate = async (basePath, { files }) => await Promise.all(files.map(async ({ fileName, contents }) => {
    const fullPath = path__default['default'].join(basePath, fileName);
    await fs__default['default'].mkdir(path__default['default'].dirname(fullPath), { recursive: true });
    await fs__default['default'].writeFile(fullPath, contents, ENCODING);
}));

exports.synthesizeTemplates = synthesizeTemplates;
exports.unsynthesizeTemplate = unsynthesizeTemplate;
