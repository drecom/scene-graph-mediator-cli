import { ExporterConstructor } from '../interface/Exporter';
import { ImporterConstructor } from '../interface/Importer';

export function exporter(runtime: string): ExporterConstructor | null {
  switch (runtime.toLowerCase()) {
    case 'cc1':
    case 'cocos1':
    case 'cocoscreator1': return require('../exporter/CocosCreator').default;
    case 'cc':
    case 'cc2':
    case 'cocos':
    case 'cocos2':
    case 'cocoscreator':
    case 'cocoscreator2': return require('../exporter/CocosCreatorV2').default;
  }

  return null;
}

export function importer(_runtime: string): ImporterConstructor | null {
  return null;
}
