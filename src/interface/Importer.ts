import { SchemaJson } from '@drecom/scene-graph-schema';

export interface Importer {
  import(schema: SchemaJson, args: any): any;
}

export interface ImporterConstructor {
  new(): any;
}
