import { SchemaJson, Node } from '@drecom/scene-graph-schema';
import CocosCreator from './CocosCreator';
import * as cc from '../interface/CocosCreator';

export default class CocosCreatorV2 extends CocosCreator {
  /**
   * Add node to SchemaJson.scene.<br />
   * Convert transform to SchemaJson schema.
   */
  protected appendNodes(json: cc.ComponentBase[], graph: SchemaJson): void {
    const canvas = this.findComponentByType(json, cc.MetaTypes.CANVAS) as cc.Canvas;

    // collect nodes identified by id, scene file terats index as node id
    const nodes = new Map<number, cc.ComponentBase>();
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (component.__type__ === cc.MetaTypes.NODE) {
        nodes.set(i, component);
      }
    }

    nodes.forEach((value, i) => {
      const node = value as cc.NodeV2;
      const position = node._position;
      const type = node.__type__;
      if (type === cc.MetaTypes.NODE && !position) {
        return;
      }

      let parentId = null;
      let isRoot   = false;
      const isCanvas = (i === canvas.node.__id__);

      // CocosCreator's Scene has Canvas as root children
      if (node._parent) {
        parentId = node._parent.__id__;
        if (json[parentId].__type__ === cc.MetaTypes.SCENE) {
          isRoot = true;
        }
      }

      const schemaNode: Node = {
        id: i.toString(),
        name: node._name,
        constructorName: type,
        transform: {
          width:  node._contentSize.width,
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
      const children = node._children;
      for (let j = 0; j < children.length; j++) {
        schemaNode.transform.children.push(children[j].__id__.toString());
      }

      graph.scene.push(schemaNode);
    });
  }
}
