import { Transform } from '@drecom/scene-graph-schema';
import CocosCreator from './CocosCreator';
import * as cc from '../../interface/CocosCreator';
export default class CocosCreatorV2 extends CocosCreator {
    getIdentifier(): string;
    protected createDefaultTransform(component: cc.ComponentBase): Transform;
}
