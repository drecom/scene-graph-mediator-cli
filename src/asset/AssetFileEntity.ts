import * as path from 'path';

export default class AssetFileEntity {
  public readonly filePath!: string;

  get extension(): string {
    return path.extname(this.filePath);
  }

  constructor(absolutePath: string) {
    if (!path.isAbsolute(absolutePath)) {
      throw new Error('AssetFileEntity only accepts absolute path as constructor argument');
    }
    this.filePath = absolutePath;
  }

  public relativeLocalPath(basePath: string): string {
    return this.filePath.replace(basePath, '').replace(/^\//, '')
  }
}
