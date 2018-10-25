"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var AssetFileEntity = /** @class */ (function () {
    function AssetFileEntity(absolutePath) {
        if (!path.isAbsolute(absolutePath)) {
            throw new Error('AssetFileEntity only accepts absolute path as constructor argument');
        }
        this.filePath = absolutePath;
    }
    Object.defineProperty(AssetFileEntity.prototype, "extension", {
        get: function () {
            return path.extname(this.filePath);
        },
        enumerable: true,
        configurable: true
    });
    AssetFileEntity.prototype.relativeLocalPath = function (basePath) {
        return this.filePath.replace(basePath, '').replace(/^\//, '');
    };
    return AssetFileEntity;
}());
exports.default = AssetFileEntity;
//# sourceMappingURL=AssetFileEntity.js.map