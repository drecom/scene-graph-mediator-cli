import { SchemaJson, Node, Transform } from '@drecom/scene-graph-schema';
import * as cc from '../../interface/CocosCreator';
import SceneExporter from '../../interface/SceneExporter';
import SceneExporterPlugin from '../../interface/SceneExporterPlugin';
import AssetFileMap from '../../asset/AssetFileMap';
declare type ResourceMapEntity = {
    id: string;
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
export default class CocosCreator implements SceneExporter {
    getIdentifier(): string;
    /**
     * export scene graph
     */
    createSceneGraphSchemas(sceneFiles: string[], assetRoot: string, plugins?: Map<string, SceneExporterPlugin>): Map<string, SchemaJson>;
    loadSceneFile(sceneFile: string): any;
    /**
     * Create scene graph with scene file dto and collected resource map
     */
    createSceneGraph(json: any[]): SchemaJson;
    pluginPostProcess(graph: SchemaJson, sceneJson: any[], assetFileMap: AssetFileMap, plugins?: Map<string, SceneExporterPlugin>): void;
    /**
     * Created supported resource map
     */
    protected createLocalResourceMap(assetFileMap: AssetFileMap): Map<string, ResourceMapEntity>;
    protected createResourceMapEntities(absPath: string): ResourceMapEntity[];
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
}
export {};
