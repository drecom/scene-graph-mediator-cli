import { SchemaJson } from '@drecom/scene-graph-schema';
import AssetExporter from '../../interface/AssetExporter';
import AssetExporterPlugin from '../../interface/AssetExporterPlugin';
import AssetExportMapEntity from '../../interface/AssetExportMapEntity';
/**
 * CocosCreator scene exporter
 */
export default class CocosCreator implements AssetExporter {
    getIdentifier(): string;
    createExportMap(sceneGraphMap: Map<string, SchemaJson>, assetRoot: string, destDir: string, urlNameSpace: string, plugins?: Map<string, AssetExporterPlugin>): Map<string, AssetExportMapEntity>;
    replacePaths(sceneGraphMap: Map<string, SchemaJson>, exportMap: Map<string, AssetExportMapEntity>, plugins?: Map<string, AssetExporterPlugin>): void;
    private createExportMapEntity;
}
