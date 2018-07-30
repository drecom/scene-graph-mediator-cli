import * as fs from 'fs';
import * as path from 'path';

import parseArgs from './modules/parseArgs';
import * as factory from './modules/factory';

import { ErrorCode, exit } from './error/';

export default function cli(): void {
  let args;
  try {
    args = parseArgs();
  } catch (e) {
    return exit(ErrorCode.EnviromentVariableMissing);
  }

  const Klass = factory.exporter(args.runtime);
  if (!Klass) {
    return exit(ErrorCode.RuntimeNotSupported);
  }

  const exporter = new Klass(args);
  const graph    = exporter.export();
  const variants = exporter.createAssetPathVariant(graph, args);
  exporter.replaceResourceUri(graph, variants);

  /**
   * init dest dir
   */
  if (!fs.existsSync(args.destDir)) {
    fs.mkdirSync(args.destDir);
  }
  if (!fs.existsSync(args.assetDestDir)) {
    fs.mkdirSync(args.assetDestDir);
  }

  /**
   * copy assets
   */
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const destDir = path.dirname(variant.destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir);
    }
    fs.copyFileSync(variant.localPath, variant.destPath);
  }

  /**
   * write scene graph
   */
  const dest = path.resolve(args.destDir, args.graphFileName);
  fs.writeFileSync(dest, JSON.stringify(graph, null, 2));
}
