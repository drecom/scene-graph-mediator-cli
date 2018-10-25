import { SchemaJson } from '@drecom/scene-graph-schema';
import AssetExporterPlugin from './AssetExporterPlugin';
import AssetExportMapEntity from './AssetExportMapEntity';
export default interface AssetExporter {
    createExportMap(sceneGraphMap: Map<string, SchemaJson>, assetRoot: string, destDir: string, urlNameSpace: string, plugins?: Map<string, AssetExporterPlugin>): Map<string, AssetExportMapEntity>;
    replacePaths(sceneGraphMap: Map<string, SchemaJson>, exportMap: Map<string, AssetExportMapEntity>, plugins?: Map<string, AssetExporterPlugin>): void;
}
