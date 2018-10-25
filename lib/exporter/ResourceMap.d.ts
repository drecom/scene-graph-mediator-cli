export declare type ResourceMapEntity = {
    id: string;
    path: string;
} & {
    [prop: string]: any;
};
export declare class ResourceMap {
    private idIndexedMap;
    private pathIndexedMap;
    constructor();
    add(entity: ResourceMapEntity): void;
    getById(id: string): ResourceMapEntity | undefined;
    getByPath(path: string): ResourceMapEntity | undefined;
    removeById(id: string): void;
    removeByPath(path: string): void;
    forEach(callback: (entity: ResourceMapEntity) => void): void;
}
