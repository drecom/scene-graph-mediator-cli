"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function exporter(runtime) {
    switch (runtime.toLowerCase()) {
        case 'cc1':
        case 'cocos1':
        case 'cocoscreator1': return require('../exporter/CocosCreator').default;
        case 'cc':
        case 'cc2':
        case 'cocos':
        case 'cocos2':
        case 'cocoscreator':
        case 'cocoscreator2': return require('../exporter/CocosCreatorV2').default;
    }
    return null;
}
exports.exporter = exporter;
function importer(_runtime) {
    return null;
}
exports.importer = importer;
//# sourceMappingURL=factory.js.map