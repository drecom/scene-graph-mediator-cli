import { SchemaJson } from '@drecom/scene-graph-schema';
import Args from '../interface/Args';
import { Exporter } from '../interface/Exporter';
import AssetPathVariant from '../interface/AssetPathVariant';
export default class CocosCreator implements Exporter {
    private args;
    constructor(args: Args);
    export(): SchemaJson;
    createLocalResourceMap(basePath?: string, resourceMap?: Map<string, any>): Map<string, any>;
    getResourceType(resourcePath: string): string;
    loadSceneFile(): any;
    createSceneGraph(json: any[], resourceMap: Map<string, any>): SchemaJson;
    createAssetPathVariant(graph: SchemaJson, args: Args): AssetPathVariant[];
    replaceResourceUri(graph: SchemaJson, variants: AssetPathVariant[]): void;
    private addResourceMapEntity;
    private appendNodes;
    private appendMetaData;
    private appendComponents;
    private appendComponentByType;
    private findComponentByType;
    private findSchemaNodeById;
    private findVariantByLocalPath;
}
