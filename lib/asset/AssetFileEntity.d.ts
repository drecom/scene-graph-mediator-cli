export default class AssetFileEntity {
    readonly filePath: string;
    readonly extension: string;
    constructor(absolutePath: string);
    relativeLocalPath(basePath: string): string;
}
