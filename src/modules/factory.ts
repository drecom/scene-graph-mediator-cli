import { ExporterConstructor } from '../interface/Exporter';
import { ImporterConstructor } from '../interface/Importer';

export function exporter(runtime: string): ExporterConstructor | null {
  switch (runtime.toLowerCase()) {
    case 'cc':
    case 'cocos':
    case 'cocoscreator': return require('../exporter/CocosCreator').default;
  }

  return null;
}

export function importer(_runtime: string): ImporterConstructor | null {
  return null;
}
