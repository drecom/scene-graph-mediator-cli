"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function exporter(runtime) {
    switch (runtime.toLowerCase()) {
        case 'cc':
        case 'cocos':
        case 'cocoscreator': return require('../exporter/CocosCreator').default;
    }
    return null;
}
exports.exporter = exporter;
function importer(_runtime) {
    return null;
}
exports.importer = importer;
//# sourceMappingURL=factory.js.map