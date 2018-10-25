import * as fs from 'fs';
import * as path from 'path';

import AssetFileEntity from './AssetFileEntity';

/**
 * Handles file based asset list
 */
export default class AssetFileMap {
  private assetRoot!: string;
  private entities!: Map<string, AssetFileEntity>;

  constructor(assetRoot: string) {
    if (!path.isAbsolute(assetRoot)) {
      throw new Error('AssetFileMap accepts only absolute asset root.');
    }
    this.assetRoot = assetRoot;
    this.entities = new Map<string, AssetFileEntity>();
  }

  public clear(): void {
    this.entities.clear();
  }

  public get(key: string): AssetFileEntity | undefined {
    return this.entities.get(key);
  }

  public forEach(proc: (entity: AssetFileEntity, key: string) => void): void {
    this.entities.forEach(proc);
  }

  public scan(targetPath: string = this.assetRoot): void {
    const entities = fs.readdirSync(targetPath);

    for (let i = 0; i < entities.length; i++) {
      const absPath = path.resolve(targetPath, entities[i]);
      
      if (fs.statSync(absPath).isDirectory()) {
        this.scan(absPath);
      } else {
        this.entities.set(absPath, new AssetFileEntity(absPath));
      }
    }
  }
}
