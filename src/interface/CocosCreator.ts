export interface MetaUuidObj {
  __uuid__: string;
}
export interface MetaNodeIdObj {
  __id__: number;
}

export interface MetaResource {
  uuid: string;
  subMetas: {
    [key: string]: MetaResourceSubMeta
  };
}

export interface MetaResourceSubMeta {
  uuid: string;
}
export interface MetaResourceSubMetaSprite extends MetaResourceSubMeta {
  ver: string;
  rawTextureUuid: string;
  trimType: string;
  trimThreshold: number;
  rotated: boolean;
  offsetX: number;
  offsetY: number;
  trimX: number;
  trimY: number;
  width: number;
  height: number;
  rawWidth: number;
  rawHeight: number;
  borderTop: number;
  borderBottom: number;
  borderLeft: number;
  borderRight: number;
  spriteType: string;
  subMetas: {
    [key: string]: MetaResourceSubMeta
  };
}

export interface MetaBaseObject {
  __type__: string;
}

export interface Size extends MetaBaseObject {
  width: number;
  height: number;
}

export interface Vec2 extends MetaBaseObject {
  x: number;
  y: number;
}

export interface Color extends MetaBaseObject {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Component extends MetaBaseObject {
  node: MetaNodeIdObj;
}

export interface Node extends MetaBaseObject {
  _name: string;
  _parent: MetaNodeIdObj | null;
  _children: MetaNodeIdObj[];
  _contentSize: Size;
  _position: Vec2;
  _color: Color;
  _anchorPoint: Vec2;
}

export interface Canvas extends Component {
  _designResolution: Size;
}

export interface Sprite extends Component {
  _spriteFrame: MetaUuidObj;
  _atlas: MetaUuidObj | null;
}

export interface Label extends Component {
  _fontSize: number;
  _N$string: string;
  _N$fontFamily: string;
}
