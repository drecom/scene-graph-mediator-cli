import { SchemaJson } from '@drecom/scene-graph-schema';
import CocosCreator from './CocosCreator';
import * as cc from '../interface/CocosCreator';
export default class CocosCreatorV2 extends CocosCreator {
    /**
     * Add node to SchemaJson.scene.<br />
     * Convert transform to SchemaJson schema.
     */
    protected appendNodes(json: cc.ComponentBase[], graph: SchemaJson): void;
}
