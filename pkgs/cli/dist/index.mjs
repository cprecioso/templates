import fs from 'fs/promises';
import path from 'path';
import execa from 'execa';
import inquirer from 'inquirer';

const ENCODING = "base64";
const unsynthesizeTemplate = async (basePath, { files }) => await Promise.all(files.map(async ({ fileName, contents }) => {
    const fullPath = path.join(basePath, fileName);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, contents, ENCODING);
}));

var templates = ([{"templateName":"library","files":[{"fileName":"package.json","contents":"ewogICJuYW1lIjogIkB0ZW1wbGF0ZS9saWJyYXJ5IiwKICAidmVyc2lvbiI6ICIwLjAuMSIsCiAgImRldkRlcGVuZGVuY2llcyI6IHsKICAgICJAY3ByZWNpb3NvL3RzY29uZmlnIjogIioiLAogICAgIkB0eXBlcy9ub2RlIjogIioiLAogICAgIkB3ZXNzYmVyZy9yb2xsdXAtcGx1Z2luLXRzIjogIioiLAogICAgInJvbGx1cCI6ICIqIiwKICAgICJ0eXBlc2NyaXB0IjogIioiCiAgfSwKICAidHlwZSI6ICJjb21tb25qcyIsCiAgImV4cG9ydHMiOiB7CiAgICAiLiI6IHsKICAgICAgImltcG9ydCI6ICIuL2Rpc3QvaW5kZXgubWpzIiwKICAgICAgInJlcXVpcmUiOiAiLi9kaXN0L2luZGV4LmpzIgogICAgfQogIH0sCiAgIm1haW4iOiAiZGlzdC9pbmRleC5qcyIsCiAgIm1vZHVsZSI6ICJkaXN0L2luZGV4Lm1qcyIsCiAgInR5cGVzIjogImRpc3QvaW5kZXguZC50cyIsCiAgImZpbGVzIjogWwogICAgImRpc3QvKioiCiAgXSwKICAic2NyaXB0cyI6IHsKICAgICJidWlsZCI6ICJyb2xsdXAgLWMiLAogICAgInByZXBhY2siOiAieWFybiBydW4gYnVpbGQiLAogICAgInByZXB1Ymxpc2hPbmx5IjogInlhcm4gcnVuIGJ1aWxkIiwKICAgICJkZXYiOiAicm9sbHVwIC1jdyIKICB9Cn0K"},{"fileName":"rollup.config.js","contents":"Ly8gQHRzLWNoZWNrCgppbXBvcnQgdHMgZnJvbSAiQHdlc3NiZXJnL3JvbGx1cC1wbHVnaW4tdHMiCmltcG9ydCBwYXRoIGZyb20gInBhdGgiCmltcG9ydCBwa2cgZnJvbSAiLi9wYWNrYWdlLmpzb24iCgovKiogQHR5cGUge3R5cGVvZiBTdHJpbmcucmF3fSAqLwpjb25zdCByID0gKC4uLmFyZ3MpID0+IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFN0cmluZy5yYXcoLi4uYXJncykpCgpleHBvcnQgZGVmYXVsdCAvKiogQHR5cGUge2ltcG9ydCgicm9sbHVwIikuUm9sbHVwT3B0aW9uc30gKi8gKHsKICBpbnB1dDogcmBzcmMvaW5kZXgudHNgLAogIG91dHB1dDogWwogICAgeyBkaXI6ICJkaXN0IiwgZm9ybWF0OiAiZXNtIiwgZW50cnlGaWxlTmFtZXM6ICJbbmFtZV0ubWpzIiB9LAogICAgeyBkaXI6ICJkaXN0IiwgZm9ybWF0OiAiY2pzIiwgZW50cnlGaWxlTmFtZXM6ICJbbmFtZV0uanMiIH0sCiAgXSwKICBwbHVnaW5zOiBbdHMoeyB0eXBlc2NyaXB0OiByZXF1aXJlKCJ0eXBlc2NyaXB0IikgfSldLAogIGV4dGVybmFsOiBbCiAgICAuLi5yZXF1aXJlKCJtb2R1bGUiKS5idWlsdGluTW9kdWxlcywKICAgIC4uLk9iamVjdC5rZXlzKHBrZy5kZXBlbmRlbmNpZXMgfHwge30pLAogICAgLi4uT2JqZWN0LmtleXMocGtnLnBlZXJEZXBlbmRlbmNpZXMgfHwge30pLAogIF0sCn0pCg=="},{"fileName":"tsconfig.json","contents":"ewogICJleHRlbmRzIjogIkBjcHJlY2lvc28vdHNjb25maWcvZXNtIiwKICAiY29tcGlsZXJPcHRpb25zIjogewogICAgInJvb3REaXIiOiAic3JjIiwKICAgICJkZWNsYXJhdGlvbiI6IHRydWUKICB9LAogICJpbmNsdWRlIjogWyJzcmMvKiovKiIsICJ0eXBlcy8qKi8qIl0KfQo="},{"fileName":"src/index.ts","contents":"Y29uc29sZS5sb2coIkhvbGEgbXVuZG8iKQo="}]},{"templateName":"script","files":[{"fileName":"package.json","contents":"ewogICJuYW1lIjogIkB0ZW1wbGF0ZS9zY3JpcHQiLAogICJ2ZXJzaW9uIjogIjAuMC4xIiwKICAibWFpbiI6ICJsaWIvaW5kZXguanMiLAogICJiaW4iOiAibGliL2luZGV4LmpzIiwKICAiZGV2RGVwZW5kZW5jaWVzIjogewogICAgIkBjcHJlY2lvc28vdHNjb25maWciOiAiKiIsCiAgICAiQHR5cGVzL25vZGUiOiAiKiIsCiAgICAicHJldHRpZXIiOiAiKiIsCiAgICAidHlwZXNjcmlwdCI6ICIqIgogIH0sCiAgImZpbGVzIjogWwogICAgImxpYi8qKiIKICBdLAogICJzY3JpcHRzIjogewogICAgImJ1aWxkIjogInRzYyAtcCAuIiwKICAgICJwcmVwYWNrIjogInlhcm4gcnVuIGJ1aWxkIiwKICAgICJwcmVwdWJsaXNoT25seSI6ICJ5YXJuIHJ1biBidWlsZCIsCiAgICAiZGV2IjogInRzYyAtcCAuIC13IgogIH0KfQo="},{"fileName":"tsconfig.json","contents":"ewogICJleHRlbmRzIjogIkBjcHJlY2lvc28vdHNjb25maWcvbm9kZSIsCiAgImNvbXBpbGVyT3B0aW9ucyI6IHsKICAgICJyb290RGlyIjogInNyYyIsCiAgICAib3V0RGlyIjogImxpYiIsCiAgICAic291cmNlTWFwIjogdHJ1ZQogIH0sCiAgImluY2x1ZGUiOiBbInNyYy8qKi8qIiwgInR5cGVzLyoqLyoiXQp9Cg=="},{"fileName":"src/index.ts","contents":"Y29uc29sZS5sb2coIkhvbGEgbXVuZG8iKQo="}]}]);

const addToGitIgnore = async (cwd, entries) => {
    const file = path.resolve(cwd, ".gitignore");
    await fs.appendFile(file, entries.join("\n"));
};
void (async () => {
    const { cwd } = await inquirer.prompt({
        name: "cwd",
        type: "input",
        default: process.cwd(),
    });
    const { packageName } = await inquirer.prompt([
        {
            name: "packageName",
            type: "input",
            transformer: (t) => t.toLowerCase(),
            default: path.basename(cwd),
        },
    ]);
    const { templateName } = await inquirer.prompt({
        name: "templateName",
        type: "list",
        choices: templates.map((tpl) => tpl.templateName),
    });
    const working1 = (async () => {
        await unsynthesizeTemplate(cwd, templates.find((tpl) => tpl.templateName === templateName));
        const pkg = JSON.parse(await fs.readFile(path.resolve(cwd, "package.json"), "utf-8"));
        pkg.name = packageName;
        await fs.writeFile(path.resolve(cwd, "package.json"), JSON.stringify(pkg, null, 2));
    })();
    const { enablePnp } = await inquirer.prompt([
        {
            name: "enablePnp",
            type: "confirm",
            default: false,
        },
    ]);
    await working1;
    await execa("yarn", ["set", "version", "berry"], {
        stdout: "inherit",
        cwd,
    });
    await execa("yarn", ["plugin", "import", "typescript"], {
        stdout: "inherit",
        cwd,
    });
    if (enablePnp) {
        await addToGitIgnore(cwd, [
            ".yarn/*",
            "!.yarn/releases",
            "!.yarn/plugins",
            "!.yarn/sdks",
            "!.yarn/versions",
            ".pnp.*",
        ]);
    }
    else {
        await addToGitIgnore(cwd, ["node_modules"]);
        await fs.appendFile(path.resolve(cwd, ".yarnrc.yml"), "\n\nnodeLinker: node-modules\n\n");
    }
    await addToGitIgnore(cwd, [
        ".yarn/*",
        "!.yarn/releases",
        "!.yarn/plugins",
        "!.yarn/sdks",
        "!.yarn/versions",
    ]);
    await execa("yarn", { stdout: "inherit", cwd });
    await execa("yarn", ["up", "-C", "**"], { stdout: "inherit", cwd });
    console.log("Done");
})().catch((err) => console.error(err));
