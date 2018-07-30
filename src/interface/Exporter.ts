import { SchemaJson } from '@drecom/scene-graph-schema';
import Args from './Args';
import AssetPathVariant from './AssetPathVariant';

export interface Exporter {
  export(): SchemaJson;

  createLocalResourceMap(basePath?: string, resourceMap?: Map<string, any>): Map<string, any>;

  getResourceType(resourcePath: string): string;

  loadSceneFile(): any;

  createSceneGraph(json: any[], resourceMap: Map<string, string>): SchemaJson;

  createAssetPathVariant(graph: SchemaJson, args: Args): AssetPathVariant[];

  replaceResourceUri(graph: SchemaJson, variants: AssetPathVariant[]): void;
}

export interface ExporterConstructor {
  new(args: Args): Exporter;
}
