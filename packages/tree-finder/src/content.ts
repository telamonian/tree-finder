/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
export const DEFAULT_COL = "path";

export type Path = string[];

export interface IContentRow {
  path: Path;
  kind: string;
  getChildren?: () => Promise<IContentRow[]>;
}

export class Content<T extends IContentRow> {
  constructor(row: T) {
    this.isDir = row.kind === "dir";
    this.row = row;
  }

  close() {
    this._isExpand = false;
  }

  async getChild(name: string, refresh: boolean = false) {
    await this.getChildren(refresh);
    if (!this._children) {
      return;
    }

    for (const c of this._children) {
      if (name === c.name) {
        return c;
      }
    }

    return;
  }

  async getChildren(refresh: boolean = false) {
    if (!this.isDir || (!refresh && this._children)) {
      return;
    }

    // this._children = new Map<string, Content<T>>();
    // for (const c of await this.row.getChildren!()) {
    //   this._children.set(c.path.join(""), new Content(c as T));
    // }

    // this._children = new Map((await this.row.getChildren!()).map((c: T) => [c.path.join(""), new Content<T>(c)]));

    this._children = (await this.row.getChildren!()).map((c: T) => new Content<T>(c));

    return this._children;
  }

  getPathAtDepth(depth = 0, fill?: string) {
    const pth = this.row.path.slice(depth);

    if (fill !== undefined && pth.length > 1) {
      return [...Array(pth.length - 1).fill(fill), pth[pth.length - 1]];
    } else {
      return pth;
    }
  }

  get children() {
    return this._children;
    // return this._children?.values();
  }

  get isExpand() {
    return this._isExpand;
  }

  get nchildren() {
    return this._children?.length ?? 0;
    // return this._children?.size ?? 0;
  }

  async expand(refresh: boolean = false) {
    await this.getChildren(refresh);
    this._isExpand = true;
  }

  get name() {
    return (this.row.path && this.row.path.length) ? this.row.path[this.row.path.length - 1] : "";
  }


  readonly isDir: boolean;
  readonly row: T;

  // protected _children?: Map<string, Content<T>>;
  protected _children?: Content<T>[];
  protected _isExpand: boolean = false;
}
