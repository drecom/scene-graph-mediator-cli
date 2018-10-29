"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResourceMap = /** @class */ (function () {
    function ResourceMap() {
        this.idIndexedMap = new Map();
        this.pathIndexedMap = new Map();
    }
    ResourceMap.prototype.add = function (entity) {
        if (!entity.id || !entity.path) {
            throw new Error('id and path is required');
        }
        this.idIndexedMap.set(entity.id, entity);
        this.pathIndexedMap.set(entity.path, entity);
    };
    ResourceMap.prototype.getById = function (id) {
        return this.idIndexedMap.get(id);
    };
    ResourceMap.prototype.getByPath = function (path) {
        return this.pathIndexedMap.get(path);
    };
    ResourceMap.prototype.removeById = function (id) {
        var entity = this.idIndexedMap.get(id);
        if (entity) {
            this.idIndexedMap.delete(id);
            this.pathIndexedMap.delete(entity.path);
        }
    };
    ResourceMap.prototype.removeByPath = function (path) {
        var entity = this.pathIndexedMap.get(path);
        if (entity) {
            this.pathIndexedMap.delete(path);
            this.idIndexedMap.delete(entity.id);
        }
    };
    ResourceMap.prototype.forEach = function (callback) {
        this.idIndexedMap.forEach(function (entity) { return callback(entity); });
    };
    return ResourceMap;
}());
exports.ResourceMap = ResourceMap;
//# sourceMappingURL=ResourceMap.js.map