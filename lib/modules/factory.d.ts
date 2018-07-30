import { ExporterConstructor } from '../interface/Exporter';
import { ImporterConstructor } from '../interface/Importer';
export declare function exporter(runtime: string): ExporterConstructor | null;
export declare function importer(_runtime: string): ImporterConstructor | null;
