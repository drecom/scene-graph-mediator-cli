import { SchemaJson } from '@drecom/scene-graph-schema';
import Args from '../interface/Args';
import { Exporter } from '../interface/Exporter';
import AssetPathVariant from '../interface/AssetPathVariant';
/**
 * CocosCreator scene exporter
 */
export default class CocosCreator implements Exporter {
    private args;
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
    private addResourceMapEntity;
    /**
     * Add node to SchemaJson.scene.<br />
     * Convert transform to SchemaJson schema.
     */
    private appendNodes;
    private appendMetaData;
    private appendComponents;
    private appendComponentByType;
    private findComponentByType;
    private findSchemaNodeById;
    private findVariantByLocalPath;
}
