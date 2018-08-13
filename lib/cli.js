"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var parseArgs_1 = require("./modules/parseArgs");
var factory = require("./modules/factory");
var error_1 = require("./error/");
/**
 * entry point for CLI
 */
function cli() {
    var args;
    try {
        args = parseArgs_1.default();
    }
    catch (e) {
        console.log("Usage:\n  set environment variable as below, then execute lib/index.js with node\n    required:\n      RUNTIME          runtime identifier, currently supports only 'cc'\n      ASSET_ROOT       root directory for assets\n      SCENE_FILE       exporting scene file\n\n    optional:\n      DEST             destination directory;       default './scene-graph'\n      ASSET_NAME_SPACE asset directory name;        default 'assets',\n      ASSET_DEST       asset destination directory; default ${DEST}/${ASSET_NAME_SPACE}\n      GRAPH_FILE_NAME  scene graph file name;       default 'graph.json',\n\n  e.g;\n    RUNTIME=cc ASSET_ROOT=path/to/asset SCENE_FILE=path/to/scene node lib/index.js\n");
        return;
    }
    var Klass = factory.exporter(args.runtime);
    if (!Klass) {
        return error_1.exit(error_1.ErrorCode.RuntimeNotSupported);
    }
    var exporter = new Klass(args);
    var graph = exporter.export();
    var variants = exporter.createAssetPathVariant(graph, args);
    exporter.replaceResourceUri(graph, variants);
    /**
     * init dest dir
     */
    if (!fs.existsSync(args.destDir)) {
        fs.mkdirSync(args.destDir);
    }
    if (!fs.existsSync(args.assetDestDir)) {
        fs.mkdirSync(args.assetDestDir);
    }
    /**
     * copy assets
     */
    for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        var destDir = path.dirname(variant.destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        fs.copyFileSync(variant.localPath, variant.destPath);
    }
    /**
     * write scene graph
     */
    var dest = path.resolve(args.destDir, args.graphFileName);
    fs.writeFileSync(dest, JSON.stringify(graph, null, 2));
}
exports.default = cli;
//# sourceMappingURL=cli.js.map