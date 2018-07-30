import * as fs from 'fs';
import * as path from 'path';
import { SchemaJson, Node } from '@drecom/scene-graph-schema';
import * as cc from '../interface/CocosCreator';
import Args from '../interface/Args';
import { Exporter } from '../interface/Exporter';
import AssetPathVariant from '../interface/AssetPathVariant';

const ResourceType: {
  [key: string]: string
} = Object.freeze({
  NOT_RESOURCE: 'NotResource',
  SPRITE_FRAME: 'SpriteFrame',
  ATLAS: 'Atlas',
});

type ResourceMapEntity = {
  path: string;
  type: string;
  submeta?: {
    key: string;
    property: cc.MetaResourceSubMeta | undefined;
  }
};

const MetaTypes: { [keys: string]: string } = Object.freeze({
  SCENE:  'cc.Scene',
  CANVAS: 'cc.Canvas',
  NODE:   'cc.Node',
  SPRITE: 'cc.Sprite',
  LABEL:  'cc.Label'
});

export default class CocosCreator implements Exporter {

  private args!: Args;

  constructor(args: Args) {
    this.args = args;
  }

  public export(): SchemaJson {
    const sceneJson   = this.loadSceneFile();
    const resourceMap = this.createLocalResourceMap();

    return this.createSceneGraph(sceneJson, resourceMap);
  }

  public createLocalResourceMap(
    basePath?: string,
    resourceMap?: Map<string, any>
  ): Map<string, any> {
    const currentPath = basePath    || this.args.assetRoot;
    const currentMap  = resourceMap || new Map<string, ResourceMapEntity>();

    const items = fs.readdirSync(currentPath);
    for (let i = 0; i < items.length; i++) {
      const absPath = path.resolve(currentPath, items[i]);
      if (fs.statSync(absPath).isDirectory()) {
        this.createLocalResourceMap(absPath, currentMap);
      } else {
        const resourceType = this.getResourceType(absPath);
        if (resourceType !== ResourceType.NOT_RESOURCE) {
          this.addResourceMapEntity(absPath, resourceType, currentMap);
        }
      }
    }

    return currentMap;
  }

  public getResourceType(resourcePath: string): string {
    const ext = resourcePath.split('.').pop();
    switch (ext) {
      case 'png':   return ResourceType.SPRITE_FRAME;
      case 'plist': return ResourceType.ATLAS;
      default:      return ResourceType.NOT_RESOURCE;
    }
  }

  public loadSceneFile(): any {
    const content = fs.readFileSync(this.args.sceneFile).toString();
    return JSON.parse(content);
  }

  public createSceneGraph(json: any[], resourceMap: Map<string, any>): SchemaJson {
    const graph: SchemaJson = {
      scene: [],
      metadata: {
        width: 0,
        height: 0,
        positiveCoord: {
          xRight: true,
          yDown:  false
        }
      }
    };

    this.appendMetaData(json, graph);

    this.appendNodes(json, graph);

    this.appendComponents(json, graph, resourceMap);

    return graph;
  }

  public createAssetPathVariant(graph: SchemaJson, args: Args): AssetPathVariant[] {
    const variants: AssetPathVariant[] = [];

    const scene = graph.scene;

    for (let i = 0; i < scene.length; i++) {
      const node = scene[i];
      if (node.sprite) {
        const urls = [node.sprite.url, node.sprite.atlasUrl];
        for (let j = 0; j < urls.length; j++) {
          const url = urls[j];
          if (!url) {
            break;
          }

          const relPath = url.replace(args.assetRoot, '').replace(/^\//, '');

          variants.push({
            localPath: url,
            destPath:  path.resolve(args.assetDestDir, relPath),
            uri:       url.replace(args.assetRoot, `/${args.assetNameSpace}`)
          });
        }
      }
    }

    return variants;
  }

  public replaceResourceUri(graph: SchemaJson, variants: AssetPathVariant[]): void {
    const scene = graph.scene;
    for (let i = 0; i < scene.length; i++) {
      const node = scene[i];
      if (node.sprite) {
        const urlKeys = ['url', 'atlasUrl'];
        for (let j = 0; j < urlKeys.length; j++) {
          const urlKey = urlKeys[j];
          const variant = this.findVariantByLocalPath(variants, node.sprite[urlKey]);
          if (variant) {
            node.sprite[urlKey] = variant.uri;
          }
        }
      }
    }
  }

  private addResourceMapEntity(
    absPath: string,
    resourceType: string,
    map: Map<string, ResourceMapEntity>
  ): void {
    const meta = `${absPath}.meta`;
    if (!fs.existsSync(meta)) {
      return;
    }

    let json: cc.MetaResource;
    const content = fs.readFileSync(meta).toString();

    try {
      json = JSON.parse(content);
    } catch (e) {
      return;
    }

    const entity: ResourceMapEntity = {
      path: absPath,
      type: resourceType
    };

    map.set(json.uuid, entity);

    switch (resourceType) {
      case ResourceType.SPRITE_FRAME:
      case ResourceType.ATLAS: {
        const submetas = (json as cc.MetaResource).subMetas;
        const keys = Object.keys(submetas);
        for (let i = 0; i < keys.length; i++) {
          const key      = keys[i];
          const property = submetas[key];
          entity.submeta = { key, property };
          map.set(property.uuid, entity);
        }
        break;
      }
    }
  }

  private appendNodes(json: cc.MetaBaseObject[], graph: SchemaJson): void {
    const canvas = this.findComponentByType(json, MetaTypes.CANVAS) as cc.Canvas;

    const nodes = new Map<number, cc.MetaBaseObject>();
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (component.__type__ === MetaTypes.NODE) {
        nodes.set(i, component);
      }
    }

    nodes.forEach((value, i) => {
      const node = value as cc.Node;
      const position = node._position;
      const type = node.__type__;
      if (type === MetaTypes.NODE && !position) {
        return;
      }

      let parentId = null;
      let isRoot   = false;
      const isCanvas = (i === canvas.node.__id__);

      if (node._parent) {
        parentId = node._parent.__id__;
        if (json[parentId].__type__ === MetaTypes.SCENE) {
          isRoot = true;
        }
      }

      const schemaNode: Node = {
        id: i.toString(),
        name: node._name,
        constructorName: type,
        transform: {
          width:  node._contentSize.width,
          height: node._contentSize.height,
          x: (type === MetaTypes.NODE && !isCanvas) ? position.x : 0,
          y: (type === MetaTypes.NODE && !isCanvas) ? position.y : 0,
          anchor: {
            x: node._anchorPoint.x,
            y: node._anchorPoint.y
          },
          parent: (!isRoot && parentId) ? parentId.toString() : undefined
        }
      };

      schemaNode.transform.children = [];

      const children = node._children;
      for (let j = 0; j < children.length; j++) {
        schemaNode.transform.children.push(children[j].__id__.toString());
      }

      graph.scene.push(schemaNode);
    });
  }

  private appendMetaData(json: any[], graph: SchemaJson) {
    const component = this.findComponentByType(json, MetaTypes.CANVAS) as cc.Canvas;
    if (!component) {
      return;
    }

    graph.metadata.width  = component._designResolution.width;
    graph.metadata.height = component._designResolution.height;

    const node = json[component.node.__id__];
    graph.metadata.anchor = {
      x: node._anchorPoint.x,
      y: node._anchorPoint.y
    };

    graph.metadata.positiveCoord = {
      xRight: true,
      yDown:  false
    };
  }

  private appendComponents(
    json: cc.MetaBaseObject[],
    graph: SchemaJson,
    resourceMap: Map<string, ResourceMapEntity>
  ): void {
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (!(component as cc.Component).node) {
        continue;
      }

      const id = (component as cc.Component).node.__id__;

      const schemaNode = this.findSchemaNodeById(graph, id.toString());
      if (!schemaNode) {
        continue;
      }

      const node = json[id] as cc.Node;

      this.appendComponentByType(schemaNode, node, component as cc.Component, resourceMap);
    }
  }

  private appendComponentByType(
    schemaNode: Node,
    ccNode: cc.Node,
    component: cc.Component,
    resourceMap: Map<string, ResourceMapEntity>
  ): void {
    switch (component.__type__) {
      case MetaTypes.SPRITE: {
        const spriteFrameUuid = (component as cc.Sprite)._spriteFrame;
        if (!spriteFrameUuid) {
          break;
        }

        let imageEntity = resourceMap.get(spriteFrameUuid.__uuid__);
        if (!imageEntity) {
          break;
        }

        const atlasUuid = (component as cc.Sprite)._atlas;
        // _spriteFrame may directs sprite that may contain atlas path
        if (atlasUuid && this.getResourceType(imageEntity.path) === ResourceType.ATLAS) {
          if (!imageEntity.submeta) {
            break;
          }

          const spriteSubmeta = (imageEntity.submeta.property as cc.MetaResourceSubMetaSprite);

          // path to sprite
          imageEntity = resourceMap.get(spriteSubmeta.rawTextureUuid);
          if (!imageEntity) {
            break;
          }

          const atlasEntity = resourceMap.get(atlasUuid.__uuid__);
          if (!atlasEntity) {
            break;
          }

          schemaNode.sprite = {
            url: imageEntity.path,
            atlasUrl: atlasEntity.path
          };
        } else {
          schemaNode.sprite = {
            url: imageEntity.path
          };
        }

        break;
      }
      case MetaTypes.LABEL: {
        schemaNode.text = {
          text: (component as cc.Label)._N$string,
          style: {
            size: (component as cc.Label)._fontSize
          }
        };

        const color = ccNode._color;
        const colorStr = `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`;
        schemaNode.text.style.color = colorStr;

        break;
      }
      default: break;
    }
  }

  private findComponentByType(json: cc.MetaBaseObject[], type: string): cc.MetaBaseObject | null {
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (component.__type__ === type) {
        return component;
      }
    }

    return null;
  }

  private findSchemaNodeById(graph: SchemaJson, id: string): Node | null {
    const scene = graph.scene;
    for (let i = 0; i < scene.length; i++) {
      const element = scene[i];
      if (element.id === id) {
        return element;
      }
    }

    return null;
  }

  private findVariantByLocalPath(
    variants: AssetPathVariant[],
    localPath: string
  ): AssetPathVariant | null {
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (variant.localPath === localPath) {
        return variant;
      }
    }

    return null;
  }
}
