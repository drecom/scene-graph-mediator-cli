"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var CocosCreator_1 = require("./CocosCreator");
var cc = require("../interface/CocosCreator");
var CocosCreatorV2 = /** @class */ (function (_super) {
    __extends(CocosCreatorV2, _super);
    function CocosCreatorV2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Add node to SchemaJson.scene.<br />
     * Convert transform to SchemaJson schema.
     */
    CocosCreatorV2.prototype.appendNodes = function (json, graph) {
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
            var position = node._position;
            var type = node.__type__;
            if (type === cc.MetaTypes.NODE && !position) {
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
            var schemaNode = {
                id: i.toString(),
                name: node._name,
                constructorName: type,
                transform: {
                    width: node._contentSize.width,
                    height: node._contentSize.height,
                    x: (type === cc.MetaTypes.NODE && !isCanvas) ? position.x : 0,
                    y: (type === cc.MetaTypes.NODE && !isCanvas) ? position.y : 0,
                    rotation: (node._rotationX === node._rotationY) ? node._rotationX : 0,
                    scale: {
                        x: node._scale.x,
                        y: node._scale.y
                    },
                    anchor: {
                        x: node._anchorPoint.x,
                        y: node._anchorPoint.y
                    },
                    parent: (!isRoot && parentId) ? parentId.toString() : undefined
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
    return CocosCreatorV2;
}(CocosCreator_1.default));
exports.default = CocosCreatorV2;
//# sourceMappingURL=CocosCreatorV2.js.map