"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
function parseArgs() {
    var args = {
        runtime: process.env.RUNTIME || '',
        assetRoot: process.env.ASSET_ROOT || '',
        sceneFile: process.env.SCENE_FILE || '',
        destDir: process.env.DEST || path.resolve(process.cwd(), 'scene-graph'),
        assetDestDir: process.env.ASSET_DEST || '',
        assetNameSpace: process.env.ASSET_NAME_SPACE || 'assets',
        graphFileName: process.env.GRAPH_FILE_NAME || 'graph.json',
    };
    args.assetDestDir = args.assetDestDir || path.resolve(args.destDir, args.assetNameSpace);
    if (!args.runtime) {
        throw new Error();
    }
    if (!args.assetRoot) {
        throw new Error();
    }
    if (!args.sceneFile) {
        throw new Error();
    }
    if (!path.isAbsolute(args.assetRoot)) {
        args.assetRoot = path.resolve(process.cwd(), args.assetRoot);
    }
    if (!path.isAbsolute(args.sceneFile)) {
        args.sceneFile = path.resolve(process.cwd(), args.sceneFile);
    }
    if (!path.isAbsolute(args.destDir)) {
        args.destDir = path.resolve(process.cwd(), args.destDir);
    }
    args.assetRoot = args.assetRoot.replace(/\/$/, '');
    return args;
}
exports.default = parseArgs;
//# sourceMappingURL=parseArgs.js.map