import { SchemaJson, Node, Transform } from '@drecom/scene-graph-schema';
import * as cc from '../interface/CocosCreator';
import Args from '../interface/Args';
import { Exporter } from '../interface/Exporter';
import AssetPathVariant from '../interface/AssetPathVariant';
/**
 * Tentative map of resources
 */
declare type ResourceMapEntity = {
    path: string;
    metaPath: string;
    type: string;
    submetas?: {
        [key: string]: cc.MetaBase;
    };
};
/**
 * CocosCreator scene exporter
 */
export default class CocosCreator implements Exporter {
    protected args: Args;
    constructor(args: Args);
    /**
     * export scene graph with local resource and scene file
     */
    export(): SchemaJson;
    /**
     * Created supported resource map
     */
    createLocalResourceMap(basePath?: string, resourceMap?: Map<string, any>): Map<string, any>;
    /**
     * Identify resource type by path and returns.<br />
     * Note that only supported resources are identified as exporting resource.
     */
    getResourceType(resourcePath: string): string;
    loadSceneFile(): any;
    /**
     * Create scene graph with scene file dto and collected resource map
     */
    createSceneGraph(json: any[], resourceMap: Map<string, any>): SchemaJson;
    /**
     * Create AssetPathVariant for components those related to assets.
     */
    createAssetPathVariant(graph: SchemaJson, args: Args): AssetPathVariant[];
    replaceResourceUri(graph: SchemaJson, variants: AssetPathVariant[]): void;
    protected addResourceMapEntity(absPath: string, resourceType: string, map: Map<string, ResourceMapEntity>): void;
    /**
     * Add node to SchemaJson.scene.<br />
     * Convert transform to SchemaJson schema.
     */
    protected appendNodes(json: cc.ComponentBase[], graph: SchemaJson): void;
    protected createDefaultTransform(component: cc.ComponentBase): Transform;
    protected appendMetaData(json: any[], graph: SchemaJson): void;
    protected appendComponents(json: cc.ComponentBase[], graph: SchemaJson, resourceMap: Map<string, ResourceMapEntity>): void;
    protected appendComponentByType(schemaNode: Node, component: cc.Component, resourceMap: Map<string, ResourceMapEntity>): void;
    protected findComponentByType(json: cc.ComponentBase[], type: string): cc.ComponentBase | null;
    protected findSchemaNodeById(graph: SchemaJson, id: string): Node | null;
    protected findVariantByLocalPath(variants: AssetPathVariant[], localPath: string): AssetPathVariant | null;
}
export {};
