import { SchemaJson } from '@drecom/scene-graph-schema';
import SceneExporterConstructor from '../interface/SceneExporterConstructor';
import AssetExporterConstructor from '../interface/AssetExporterConstructor';
import AssetExportMapEntity from '../interface/AssetExportMapEntity';
export default class ExportManager {
    private plugins;
    static getSceneExporterClass(runtimeId: string): SceneExporterConstructor | null;
    static getAssetExporterClass(runtimeId: string): AssetExporterConstructor | null;
    loadPlugins(paths: string[]): void;
    exportScene(runtimeIdentifier: string, sceneFiles: string[], assetRoot: string): Map<string, SchemaJson>;
    exportAsset(sceneGraphs: Map<string, SchemaJson>, runtimeIdentifier: string, assetRoot: string, destDir: string, urlNameSpace: string): Map<string, AssetExportMapEntity>;
}
