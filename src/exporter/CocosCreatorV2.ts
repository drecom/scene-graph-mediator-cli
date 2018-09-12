import { Transform } from '@drecom/scene-graph-schema';
import CocosCreator from './CocosCreator';
import * as cc from '../interface/CocosCreator';

export default class CocosCreatorV2 extends CocosCreator {

  protected createDefaultTransform(component: cc.ComponentBase): Transform {
    const node = component as cc.NodeV2;

    return {
      width:  node._contentSize.width,
      height: node._contentSize.height,
      x: node._position.x,
      y: node._position.y,
      rotation: node._rotationX,
      scale: {
        // V2 has scale as Vec3
        x: node._scale.x,
        y: node._scale.y
      },
      anchor: {
        x: node._anchorPoint.x,
        y: node._anchorPoint.y
      }
    };
  }
}
