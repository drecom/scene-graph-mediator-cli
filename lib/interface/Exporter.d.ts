import { SchemaJson } from '@drecom/scene-graph-schema';
import Args from './Args';
import AssetPathVariant from './AssetPathVariant';
/**
 * Exporter interface<br />
 * It is instantiated by factory<br />
 * Constructor is defined as ExporterConstructor<br />
 */
export interface Exporter {
    /**
     * Export scene graph using arguments
     */
    export(): SchemaJson;
    /**
     * Create local resource map<br />
     * This method is called recursively, arguments are given in nested call.
     */
    createLocalResourceMap(basePath?: string, resourceMap?: Map<string, any>): Map<string, any>;
    /**
     * Identify and return resource type by path
     */
    getResourceType(resourcePath: string): string;
    /**
     * Load scene file<br />
     * It may be retrieved with args.sceneFile
     */
    loadSceneFile(): any;
    /**
     * Create scene graph<br />
     * Given json and resource map may be retrieved via createLocalResourceMap and loadSceneFile
     */
    createSceneGraph(json: any[], resourceMap: Map<string, string>): SchemaJson;
    /**
     * create AssetPathVariant object, it may contains following paths<br />
     * - path related to subject scene file<br />
     * - destination asset path<br />
     * - path presented in uri
     */
    createAssetPathVariant(graph: SchemaJson, args: Args): AssetPathVariant[];
    /**
     * Replaces resource path to uri
     */
    replaceResourceUri(graph: SchemaJson, variants: AssetPathVariant[]): void;
}
/**
 * Exporters' constructor signature for factory.
 */
export interface ExporterConstructor {
    new (args: Args): Exporter;
}
