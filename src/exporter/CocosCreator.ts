import * as fs from 'fs';
import * as path from 'path';
import { SchemaJson, Node, Transform } from '@drecom/scene-graph-schema';
import * as cc from '../interface/CocosCreator';
import Args from '../interface/Args';
import { Exporter } from '../interface/Exporter';
import AssetPathVariant from '../interface/AssetPathVariant';

/**
 * Cocos Creator resource type
 */
const ResourceType: {
  [key: string]: string
} = Object.freeze({
  NOT_RESOURCE: 'NotResource',
  SPRITE_FRAME: 'SpriteFrame',
  ATLAS: 'Atlas',
});

/**
 * Tentative map of resources
 */
type ResourceMapEntity = {
  path: string;
  metaPath: string;
  type: string;
  submetas?: { [key: string]: cc.MetaBase }
};

/**
 * CocosCreator scene exporter
 */
export default class CocosCreator implements Exporter {

  protected args!: Args;

  constructor(args: Args) {
    this.args = args;
  }

  /**
   * export scene graph with local resource and scene file
   */
  public export(): SchemaJson {
    const sceneJson   = this.loadSceneFile();
    const resourceMap = this.createLocalResourceMap();

    return this.createSceneGraph(sceneJson, resourceMap);
  }

  /**
   * Created supported resource map
   */
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

  /**
   * Identify resource type by path and returns.<br />
   * Note that only supported resources are identified as exporting resource.
   */
  public getResourceType(resourcePath: string): string {
    const ext = resourcePath.split('.').pop();
    if (!ext) {
      return ResourceType.NOT_RESOURCE;
    }

    // TODO: accept user defined types
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':   return ResourceType.SPRITE_FRAME;
      case 'plist': return ResourceType.ATLAS;
      default:      return ResourceType.NOT_RESOURCE;
    }
  }

  public loadSceneFile(): any {
    const content = fs.readFileSync(this.args.sceneFile).toString();
    return JSON.parse(content);
  }

  /**
   * Create scene graph with scene file dto and collected resource map
   */
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

  /**
   * Create AssetPathVariant for components those related to assets.
   */
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
    const scene   = graph.scene;
    const urlKeys = ['url', 'atlasUrl'];
    for (let i = 0; i < scene.length; i++) {
      const node = scene[i];
      if (node.sprite) {
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

  protected addResourceMapEntity(
    absPath: string,
    resourceType: string,
    map: Map<string, ResourceMapEntity>
  ): void {
    const meta = `${absPath}.meta`;
    if (!fs.existsSync(meta)) {
      return;
    }

    let json: cc.MetaBase;
    const content = fs.readFileSync(meta).toString();

    try {
      json = JSON.parse(content);
    } catch (e) {
      return;
    }

    const entity: ResourceMapEntity = {
      path: absPath,
      metaPath: meta,
      type: resourceType
    };

    map.set(json.uuid, entity);

    // add submetas if exists
    switch (resourceType) {
      case ResourceType.SPRITE_FRAME:
      case ResourceType.ATLAS: {
        const submetas = (json as cc.MetaBase).subMetas;
        entity.submetas = submetas;
        const keys = Object.keys(submetas);
        for (let i = 0; i < keys.length; i++) {
          const submeta = submetas[keys[i]];
          map.set(submeta.uuid, {
            path: absPath,
            metaPath: meta,
            type: resourceType,
            submetas: submeta.subMetas
          });
        }
        break;
      }
    }
  }

  /**
   * Add node to SchemaJson.scene.<br />
   * Convert transform to SchemaJson schema.
   */
  protected appendNodes(json: cc.ComponentBase[], graph: SchemaJson): void {
    const canvas = this.findComponentByType(json, cc.MetaTypes.CANVAS) as cc.Canvas;

    // collect nodes identified by id, scene file terats index as node id
    const nodes = new Map<number, cc.ComponentBase>();
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (component.__type__ === cc.MetaTypes.NODE) {
        nodes.set(i, component);
      }
    }

    nodes.forEach((value, i) => {
      const node = value as cc.Node;
      if (node.__type__ === cc.MetaTypes.NODE && !node._position) {
        return;
      }

      let parentId = null;
      let isRoot   = false;
      const isCanvas = (i === canvas.node.__id__);

      // CocosCreator's Scene has Canvas as root children
      if (node._parent) {
        parentId = node._parent.__id__;
        if (json[parentId].__type__ === cc.MetaTypes.SCENE) {
          isRoot = true;
        }
      }

      const transform = this.createDefaultTransform(node);
      if (node.__type__ !== cc.MetaTypes.NODE || isCanvas) {
        transform.x = 0;
        transform.y = 0;
      }
      if (node._rotationX !== node._rotationY) {
        transform.rotation = 0;
      }
      if (!isRoot && parentId) {
        transform.parent = parentId.toString();
      }

      const schemaNode: Node = {
        id: i.toString(),
        name: node._name,
        constructorName: node.__type__,
        transform: transform,
        renderer: {
          color: {
            r: node._color.r,
            g: node._color.g,
            b: node._color.b,
            // cocos's bug? _color.a is not used
            a: node._opacity
          }
        }
      };

      schemaNode.transform.children = [];

      // detect children and push
      const children = node._children;
      for (let j = 0; j < children.length; j++) {
        schemaNode.transform.children.push(children[j].__id__.toString());
      }

      graph.scene.push(schemaNode);
    });
  }

  protected createDefaultTransform(component: cc.ComponentBase): Transform {
    const node = component as cc.Node;

    return {
      width:  node._contentSize.width,
      height: node._contentSize.height,
      x: node._position.x,
      y: node._position.y,
      rotation: node._rotationX,
      scale: {
        x: node._scaleX,
        y: node._scaleY
      },
      anchor: {
        x: node._anchorPoint.x,
        y: node._anchorPoint.y
      }
    };
  }

  protected appendMetaData(json: any[], graph: SchemaJson) {
    const component = this.findComponentByType(json, cc.MetaTypes.CANVAS) as cc.Canvas;
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

    // cocos's coordinate system has zero-zero coordinate on left bottom.
    graph.metadata.positiveCoord = {
      xRight: true,
      yDown:  false
    };
  }

  protected appendComponents(
    json: cc.ComponentBase[],
    graph: SchemaJson,
    resourceMap: Map<string, ResourceMapEntity>
  ): void {
    for (let i = 0; i < json.length; i++) {
      const component = json[i] as cc.Component;
      if (!component.node) {
        continue;
      }

      const schemaNode = this.findSchemaNodeById(graph, component.node.__id__.toString());
      if (!schemaNode) {
        continue;
      }

      this.appendComponentByType(schemaNode, component, resourceMap);
    }
  }

  protected appendComponentByType(
    schemaNode: Node,
    component: cc.Component,
    resourceMap: Map<string, ResourceMapEntity>
  ): void {
    switch (component.__type__) {
      case cc.MetaTypes.SPRITE: {
        const spriteFrameUuid = (component as cc.Sprite)._spriteFrame;
        if (!spriteFrameUuid) {
          break;
        }

        const spriteFrameEntity = resourceMap.get(spriteFrameUuid.__uuid__);
        if (!spriteFrameEntity) {
          break;
        }

        let submeta: cc.MetaSprite | null = null;

        const atlasUuid = (component as cc.Sprite)._atlas;
        // _spriteFrame may directs sprite that may contain atlas path
        if (atlasUuid) {
          const atlasEntity = resourceMap.get(atlasUuid.__uuid__);
          if (!atlasEntity) {
            break;
          }

          // TODO: shouldn't read file
          const atlasMetaContent = fs.readFileSync(atlasEntity.metaPath);
          const atlasMetaJson = JSON.parse(atlasMetaContent.toString()) as cc.MetaBase;

          let frameName: string | null = null;

          const keys = Object.keys(atlasMetaJson.subMetas);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (atlasMetaJson.subMetas[key].uuid === spriteFrameUuid.__uuid__) {
              frameName = key;
              submeta   = atlasMetaJson.subMetas[key] as cc.MetaSprite;
              break;
            }
          }

          if (!frameName) {
            break;
          }

          // path to sprite
          const rawTextureEntity = resourceMap.get((submeta as cc.MetaSprite).rawTextureUuid);
          if (!rawTextureEntity) {
            break;
          }

          schemaNode.sprite = {
            frameName,
            url: rawTextureEntity.path,
            atlasUrl: atlasEntity.path
          };
        } else {
          // TODO: shouldn't read file
          const spriteFrameMetaContent = fs.readFileSync(spriteFrameEntity.metaPath);
          const spriteFrameMetaJson = JSON.parse(spriteFrameMetaContent.toString()) as cc.MetaBase;
          const keys = Object.keys(spriteFrameMetaJson.subMetas);
          if (keys.length === 0) {
            break;
          }

          const key = keys[0];
          submeta = spriteFrameMetaJson.subMetas[key] as cc.MetaSprite;
          schemaNode.sprite = {
            url: spriteFrameEntity.path,
            frameName: key
          };
        }

        if (
          submeta && (
            submeta.borderTop    !== 0 ||
            submeta.borderBottom !== 0 ||
            submeta.borderLeft   !== 0 ||
            submeta.borderRight  !== 0
          )
        ) {
          schemaNode.sprite.slice = {
            top:    submeta.borderTop,
            bottom: submeta.borderBottom,
            left:   submeta.borderLeft,
            right:  submeta.borderRight
          };
        }

        break;
      }
      case cc.MetaTypes.LABEL: {
        schemaNode.text = {
          text: (component as cc.Label)._N$string,
          style: {
            size: (component as cc.Label)._fontSize,
            horizontalAlign: (component as cc.Label)._N$horizontalAlign
          }
        };

        // TODO: alpha
        let colorStr = '#FFFFFF';
        if (schemaNode.renderer && schemaNode.renderer.color) {
          // Label uses node color
          const color = schemaNode.renderer.color;
          colorStr = `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`;
        }
        schemaNode.text.style.color = colorStr;

        break;
      }
      default: break;
    }
  }

  protected findComponentByType(json: cc.ComponentBase[], type: string): cc.ComponentBase | null {
    for (let i = 0; i < json.length; i++) {
      const component = json[i];
      if (component.__type__ === type) {
        return component;
      }
    }

    return null;
  }

  protected findSchemaNodeById(graph: SchemaJson, id: string): Node | null {
    const scene = graph.scene;
    for (let i = 0; i < scene.length; i++) {
      const element = scene[i];
      if (element.id === id) {
        return element;
      }
    }

    return null;
  }

  protected findVariantByLocalPath(
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
