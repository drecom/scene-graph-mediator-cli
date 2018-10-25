import AssetFileEntity from './AssetFileEntity';
/**
 * Handles file based asset list
 */
export default class AssetFileMap {
    private assetRoot;
    private entities;
    constructor(assetRoot: string);
    clear(): void;
    get(key: string): AssetFileEntity | undefined;
    forEach(proc: (entity: AssetFileEntity, key: string) => void): void;
    scan(targetPath?: string): void;
}
