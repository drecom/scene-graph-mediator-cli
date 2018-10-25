import { SchemaJson } from '@drecom/scene-graph-schema';
import AssetFileMap from '../asset/AssetFileMap';

export default interface ExporterPlugin {
  extendSceneGraph(graph: SchemaJson, dataSource: any, assetFileMap: AssetFileMap): void;
}
