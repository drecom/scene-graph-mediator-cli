"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var AssetFileEntity_1 = require("./AssetFileEntity");
/**
 * Handles file based asset list
 */
var AssetFileMap = /** @class */ (function () {
    function AssetFileMap(assetRoot) {
        if (!path.isAbsolute(assetRoot)) {
            throw new Error('AssetFileMap accepts only absolute asset root.');
        }
        this.assetRoot = assetRoot;
        this.entities = new Map();
    }
    AssetFileMap.prototype.clear = function () {
        this.entities.clear();
    };
    AssetFileMap.prototype.get = function (key) {
        return this.entities.get(key);
    };
    AssetFileMap.prototype.forEach = function (proc) {
        this.entities.forEach(proc);
    };
    AssetFileMap.prototype.scan = function (targetPath) {
        if (targetPath === void 0) { targetPath = this.assetRoot; }
        var entities = fs.readdirSync(targetPath);
        for (var i = 0; i < entities.length; i++) {
            var absPath = path.resolve(targetPath, entities[i]);
            if (fs.statSync(absPath).isDirectory()) {
                this.scan(absPath);
            }
            else {
                this.entities.set(absPath, new AssetFileEntity_1.default(absPath));
            }
        }
    };
    return AssetFileMap;
}());
exports.default = AssetFileMap;
//# sourceMappingURL=AssetFileMap.js.map