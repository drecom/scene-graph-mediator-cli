"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var cc = require("../interface/CocosCreator");
/**
 * Cocos Creator resource type
 */
var ResourceType = Object.freeze({
    NOT_RESOURCE: 'NotResource',
    SPRITE_FRAME: 'SpriteFrame',
    ATLAS: 'Atlas',
});
/**
 * CocosCreator scene exporter
 */
var CocosCreator = /** @class */ (function () {
    function CocosCreator(args) {
        this.args = args;
    }
    /**
     * export scene graph with local resource and scene file
     */
    CocosCreator.prototype.export = function () {
        var sceneJson = this.loadSceneFile();
        var resourceMap = this.createLocalResourceMap();
        return this.createSceneGraph(sceneJson, resourceMap);
    };
    /**
     * Created supported resource map
     */
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
    /**
     * Identify resource type by path and returns.<br />
     * Note that only supported resources are identified as exporting resource.
     */
    CocosCreator.prototype.getResourceType = function (resourcePath) {
        var ext = resourcePath.split('.').pop();
        if (!ext) {
            return ResourceType.NOT_RESOURCE;
        }
        // TODO: accept user defined types
        switch (ext.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
            case 'png': return ResourceType.SPRITE_FRAME;
            case 'plist': return ResourceType.ATLAS;
            default: return ResourceType.NOT_RESOURCE;
        }
    };
    CocosCreator.prototype.loadSceneFile = function () {
        var content = fs.readFileSync(this.args.sceneFile).toString();
        return JSON.parse(content);
    };
    /**
     * Create scene graph with scene file dto and collected resource map
     */
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
    /**
     * Create AssetPathVariant for components those related to assets.
     */
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
        var urlKeys = ['url', 'atlasUrl'];
        for (var i = 0; i < scene.length; i++) {
            var node = scene[i];
            if (node.sprite) {
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
            metaPath: meta,
            type: resourceType
        };
        map.set(json.uuid, entity);
        // add submetas if exists
        switch (resourceType) {
            case ResourceType.SPRITE_FRAME:
            case ResourceType.ATLAS: {
                var submetas = json.subMetas;
                entity.submetas = submetas;
                var keys = Object.keys(submetas);
                for (var i = 0; i < keys.length; i++) {
                    var submeta = submetas[keys[i]];
                    map.set(submeta.uuid, {
                        path: absPath,
                        metaPath: meta,
                        type: resourceType,
                        submetas: submeta.subMetas
                    });
                }
                break;
            }
        }
    };
    /**
     * Add node to SchemaJson.scene.<br />
     * Convert transform to SchemaJson schema.
     */
    CocosCreator.prototype.appendNodes = function (json, graph) {
        var _this = this;
        var canvas = this.findComponentByType(json, cc.MetaTypes.CANVAS);
        // collect nodes identified by id, scene file terats index as node id
        var nodes = new Map();
        for (var i = 0; i < json.length; i++) {
            var component = json[i];
            if (component.__type__ === cc.MetaTypes.NODE) {
                nodes.set(i, component);
            }
        }
        nodes.forEach(function (value, i) {
            var node = value;
            if (node.__type__ === cc.MetaTypes.NODE && !node._position) {
                return;
            }
            var parentId = null;
            var isRoot = false;
            var isCanvas = (i === canvas.node.__id__);
            // CocosCreator's Scene has Canvas as root children
            if (node._parent) {
                parentId = node._parent.__id__;
                if (json[parentId].__type__ === cc.MetaTypes.SCENE) {
                    isRoot = true;
                }
            }
            var transform = _this.createDefaultTransform(node);
            if (node.__type__ !== cc.MetaTypes.NODE || isCanvas) {
                transform.x = 0;
                transform.y = 0;
            }
            if (node._rotationX !== node._rotationY) {
                transform.rotation = 0;
            }
            if (!isRoot && parentId) {
                transform.parent = parentId.toString();
            }
            var schemaNode = {
                id: i.toString(),
                name: node._name,
                constructorName: node.__type__,
                transform: transform,
                renderer: {
                    color: {
                        r: node._color.r,
                        g: node._color.g,
                        b: node._color.b,
                        // cocos's bug? _color.a is not used
                        a: node._opacity
                    }
                }
            };
            schemaNode.transform.children = [];
            // detect children and push
            var children = node._children;
            for (var j = 0; j < children.length; j++) {
                schemaNode.transform.children.push(children[j].__id__.toString());
            }
            graph.scene.push(schemaNode);
        });
    };
    CocosCreator.prototype.createDefaultTransform = function (component) {
        var node = component;
        return {
            width: node._contentSize.width,
            height: node._contentSize.height,
            x: node._position.x,
            y: node._position.y,
            rotation: node._rotationX,
            scale: {
                x: node._scaleX,
                y: node._scaleY
            },
            anchor: {
                x: node._anchorPoint.x,
                y: node._anchorPoint.y
            }
        };
    };
    CocosCreator.prototype.appendMetaData = function (json, graph) {
        var component = this.findComponentByType(json, cc.MetaTypes.CANVAS);
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
        // cocos's coordinate system has zero-zero coordinate on left bottom.
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
            var schemaNode = this.findSchemaNodeById(graph, component.node.__id__.toString());
            if (!schemaNode) {
                continue;
            }
            this.appendComponentByType(schemaNode, component, resourceMap);
        }
    };
    CocosCreator.prototype.appendComponentByType = function (schemaNode, component, resourceMap) {
        switch (component.__type__) {
            case cc.MetaTypes.SPRITE: {
                var spriteFrameUuid = component._spriteFrame;
                if (!spriteFrameUuid) {
                    break;
                }
                var spriteFrameEntity = resourceMap.get(spriteFrameUuid.__uuid__);
                if (!spriteFrameEntity) {
                    break;
                }
                var submeta = null;
                var atlasUuid = component._atlas;
                // _spriteFrame may directs sprite that may contain atlas path
                if (atlasUuid) {
                    var atlasEntity = resourceMap.get(atlasUuid.__uuid__);
                    if (!atlasEntity) {
                        break;
                    }
                    // TODO: shouldn't read file
                    var atlasMetaContent = fs.readFileSync(atlasEntity.metaPath);
                    var atlasMetaJson = JSON.parse(atlasMetaContent.toString());
                    var frameName = null;
                    var keys = Object.keys(atlasMetaJson.subMetas);
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        if (atlasMetaJson.subMetas[key].uuid === spriteFrameUuid.__uuid__) {
                            frameName = key;
                            submeta = atlasMetaJson.subMetas[key];
                            break;
                        }
                    }
                    if (!frameName) {
                        break;
                    }
                    // path to sprite
                    var rawTextureEntity = resourceMap.get(submeta.rawTextureUuid);
                    if (!rawTextureEntity) {
                        break;
                    }
                    schemaNode.sprite = {
                        frameName: frameName,
                        url: rawTextureEntity.path,
                        atlasUrl: atlasEntity.path
                    };
                }
                else {
                    // TODO: shouldn't read file
                    var spriteFrameMetaContent = fs.readFileSync(spriteFrameEntity.metaPath);
                    var spriteFrameMetaJson = JSON.parse(spriteFrameMetaContent.toString());
                    var keys = Object.keys(spriteFrameMetaJson.subMetas);
                    if (keys.length === 0) {
                        break;
                    }
                    var key = keys[0];
                    submeta = spriteFrameMetaJson.subMetas[key];
                    schemaNode.sprite = {
                        url: spriteFrameEntity.path,
                        frameName: key
                    };
                }
                if (submeta && (submeta.borderTop !== 0 ||
                    submeta.borderBottom !== 0 ||
                    submeta.borderLeft !== 0 ||
                    submeta.borderRight !== 0)) {
                    schemaNode.sprite.slice = {
                        top: submeta.borderTop,
                        bottom: submeta.borderBottom,
                        left: submeta.borderLeft,
                        right: submeta.borderRight
                    };
                }
                break;
            }
            case cc.MetaTypes.LABEL: {
                schemaNode.text = {
                    text: component._N$string,
                    style: {
                        size: component._fontSize,
                        horizontalAlign: component._N$horizontalAlign
                    }
                };
                // TODO: alpha
                var colorStr = '#FFFFFF';
                if (schemaNode.renderer && schemaNode.renderer.color) {
                    // Label uses node color
                    var color = schemaNode.renderer.color;
                    colorStr = "#" + color.r.toString(16) + color.g.toString(16) + color.b.toString(16);
                }
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