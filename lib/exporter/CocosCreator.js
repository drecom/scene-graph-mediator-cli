"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var ResourceType = Object.freeze({
    NOT_RESOURCE: 'NotResource',
    SPRITE_FRAME: 'SpriteFrame',
    ATLAS: 'Atlas',
});
var MetaTypes = Object.freeze({
    SCENE: 'cc.Scene',
    CANVAS: 'cc.Canvas',
    NODE: 'cc.Node',
    SPRITE: 'cc.Sprite',
    LABEL: 'cc.Label'
});
var CocosCreator = /** @class */ (function () {
    function CocosCreator(args) {
        this.args = args;
    }
    CocosCreator.prototype.export = function () {
        var sceneJson = this.loadSceneFile();
        var resourceMap = this.createLocalResourceMap();
        return this.createSceneGraph(sceneJson, resourceMap);
    };
    CocosCreator.prototype.createLocalResourceMap = function (basePath, resourceMap) {
        var currentPath = basePath || this.args.assetRoot;
        var currentMap = resourceMap || new Map();
        var items = fs.readdirSync(currentPath);
        for (var i = 0; i < items.length; i++) {
            var absPath = path.resolve(currentPath, items[i]);
            if (fs.statSync(absPath).isDirectory()) {
                this.createLocalResourceMap(absPath, currentMap);
            }
            else {
                var resourceType = this.getResourceType(absPath);
                if (resourceType !== ResourceType.NOT_RESOURCE) {
                    this.addResourceMapEntity(absPath, resourceType, currentMap);
                }
            }
        }
        return currentMap;
    };
    CocosCreator.prototype.getResourceType = function (resourcePath) {
        var ext = resourcePath.split('.').pop();
        switch (ext) {
            case 'png': return ResourceType.SPRITE_FRAME;
            case 'plist': return ResourceType.ATLAS;
            default: return ResourceType.NOT_RESOURCE;
        }
    };
    CocosCreator.prototype.loadSceneFile = function () {
        var content = fs.readFileSync(this.args.sceneFile).toString();
        return JSON.parse(content);
    };
    CocosCreator.prototype.createSceneGraph = function (json, resourceMap) {
        var graph = {
            scene: [],
            metadata: {
                width: 0,
                height: 0,
                positiveCoord: {
                    xRight: true,
                    yDown: false
                }
            }
        };
        this.appendMetaData(json, graph);
        this.appendNodes(json, graph);
        this.appendComponents(json, graph, resourceMap);
        return graph;
    };
    CocosCreator.prototype.createAssetPathVariant = function (graph, args) {
        var variants = [];
        var scene = graph.scene;
        for (var i = 0; i < scene.length; i++) {
            var node = scene[i];
            if (node.sprite) {
                var urls = [node.sprite.url, node.sprite.atlasUrl];
                for (var j = 0; j < urls.length; j++) {
                    var url = urls[j];
                    if (!url) {
                        break;
                    }
                    var relPath = url.replace(args.assetRoot, '').replace(/^\//, '');
                    variants.push({
                        localPath: url,
                        destPath: path.resolve(args.assetDestDir, relPath),
                        uri: url.replace(args.assetRoot, "/" + args.assetNameSpace)
                    });
                }
            }
        }
        return variants;
    };
    CocosCreator.prototype.replaceResourceUri = function (graph, variants) {
        var scene = graph.scene;
        for (var i = 0; i < scene.length; i++) {
            var node = scene[i];
            if (node.sprite) {
                var urlKeys = ['url', 'atlasUrl'];
                for (var j = 0; j < urlKeys.length; j++) {
                    var urlKey = urlKeys[j];
                    var variant = this.findVariantByLocalPath(variants, node.sprite[urlKey]);
                    if (variant) {
                        node.sprite[urlKey] = variant.uri;
                    }
                }
            }
        }
    };
    CocosCreator.prototype.addResourceMapEntity = function (absPath, resourceType, map) {
        var meta = absPath + ".meta";
        if (!fs.existsSync(meta)) {
            return;
        }
        var json;
        var content = fs.readFileSync(meta).toString();
        try {
            json = JSON.parse(content);
        }
        catch (e) {
            return;
        }
        var entity = {
            path: absPath,
            type: resourceType
        };
        map.set(json.uuid, entity);
        switch (resourceType) {
            case ResourceType.SPRITE_FRAME:
            case ResourceType.ATLAS: {
                var submetas = json.subMetas;
                var keys = Object.keys(submetas);
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    var property = submetas[key];
                    entity.submeta = { key: key, property: property };
                    map.set(property.uuid, entity);
                }
                break;
            }
        }
    };
    CocosCreator.prototype.appendNodes = function (json, graph) {
        var canvas = this.findComponentByType(json, MetaTypes.CANVAS);
        var nodes = new Map();
        for (var i = 0; i < json.length; i++) {
            var component = json[i];
            if (component.__type__ === MetaTypes.NODE) {
                nodes.set(i, component);
            }
        }
        nodes.forEach(function (value, i) {
            var node = value;
            var position = node._position;
            var type = node.__type__;
            if (type === MetaTypes.NODE && !position) {
                return;
            }
            var parentId = null;
            var isRoot = false;
            var isCanvas = (i === canvas.node.__id__);
            if (node._parent) {
                parentId = node._parent.__id__;
                if (json[parentId].__type__ === MetaTypes.SCENE) {
                    isRoot = true;
                }
            }
            var schemaNode = {
                id: i.toString(),
                name: node._name,
                constructorName: type,
                transform: {
                    width: node._contentSize.width,
                    height: node._contentSize.height,
                    x: (type === MetaTypes.NODE && !isCanvas) ? position.x : 0,
                    y: (type === MetaTypes.NODE && !isCanvas) ? position.y : 0,
                    anchor: {
                        x: node._anchorPoint.x,
                        y: node._anchorPoint.y
                    },
                    parent: (!isRoot && parentId) ? parentId.toString() : undefined
                }
            };
            schemaNode.transform.children = [];
            var children = node._children;
            for (var j = 0; j < children.length; j++) {
                schemaNode.transform.children.push(children[j].__id__.toString());
            }
            graph.scene.push(schemaNode);
        });
    };
    CocosCreator.prototype.appendMetaData = function (json, graph) {
        var component = this.findComponentByType(json, MetaTypes.CANVAS);
        if (!component) {
            return;
        }
        graph.metadata.width = component._designResolution.width;
        graph.metadata.height = component._designResolution.height;
        var node = json[component.node.__id__];
        graph.metadata.anchor = {
            x: node._anchorPoint.x,
            y: node._anchorPoint.y
        };
        graph.metadata.positiveCoord = {
            xRight: true,
            yDown: false
        };
    };
    CocosCreator.prototype.appendComponents = function (json, graph, resourceMap) {
        for (var i = 0; i < json.length; i++) {
            var component = json[i];
            if (!component.node) {
                continue;
            }
            var id = component.node.__id__;
            var schemaNode = this.findSchemaNodeById(graph, id.toString());
            if (!schemaNode) {
                continue;
            }
            var node = json[id];
            this.appendComponentByType(schemaNode, node, component, resourceMap);
        }
    };
    CocosCreator.prototype.appendComponentByType = function (schemaNode, ccNode, component, resourceMap) {
        switch (component.__type__) {
            case MetaTypes.SPRITE: {
                var spriteFrameUuid = component._spriteFrame;
                if (!spriteFrameUuid) {
                    break;
                }
                var imageEntity = resourceMap.get(spriteFrameUuid.__uuid__);
                if (!imageEntity) {
                    break;
                }
                var atlasUuid = component._atlas;
                // _spriteFrame may directs sprite that may contain atlas path
                if (atlasUuid && this.getResourceType(imageEntity.path) === ResourceType.ATLAS) {
                    if (!imageEntity.submeta) {
                        break;
                    }
                    // path to sprite
                    imageEntity = resourceMap.get(imageEntity.submeta.property.rawTextureUuid);
                    if (!imageEntity) {
                        break;
                    }
                    var atlasEntity = resourceMap.get(atlasUuid.__uuid__);
                    if (!atlasEntity) {
                        break;
                    }
                    schemaNode.sprite = {
                        url: imageEntity.path,
                        atlasUrl: atlasEntity.path
                    };
                }
                else {
                    schemaNode.sprite = {
                        url: imageEntity.path
                    };
                }
                break;
            }
            case MetaTypes.LABEL: {
                schemaNode.text = {
                    text: component._N$string,
                    style: {
                        size: component._fontSize
                    }
                };
                var color = ccNode._color;
                var colorStr = "#" + color.r.toString(16) + color.g.toString(16) + color.b.toString(16);
                schemaNode.text.style.color = colorStr;
                break;
            }
            default: break;
        }
    };
    CocosCreator.prototype.findComponentByType = function (json, type) {
        for (var i = 0; i < json.length; i++) {
            var component = json[i];
            if (component.__type__ === type) {
                return component;
            }
        }
        return null;
    };
    CocosCreator.prototype.findSchemaNodeById = function (graph, id) {
        var scene = graph.scene;
        for (var i = 0; i < scene.length; i++) {
            var element = scene[i];
            if (element.id === id) {
                return element;
            }
        }
        return null;
    };
    CocosCreator.prototype.findVariantByLocalPath = function (variants, localPath) {
        for (var i = 0; i < variants.length; i++) {
            var variant = variants[i];
            if (variant.localPath === localPath) {
                return variant;
            }
        }
        return null;
    };
    return CocosCreator;
}());
exports.default = CocosCreator;
//# sourceMappingURL=CocosCreator.js.map