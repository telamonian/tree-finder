/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Path } from "./util";

export const DEFAULT_COL = "path";

export interface IContentRow {
  path: Path.PathArray;
  kind: "dir" | string;
  getChildren?: () => Promise<IContentRow[]>;
}

interface IContentDirRow {
  path: Path.PathArray;
  kind: "dir";
  getChildren: () => Promise<IContentRow[]>;
}

export class Content<T extends IContentRow> {
  constructor(row: T) {
    this.isDir = row.kind === "dir";
    this.row = row;
  }

  close() {
    this._isExpand = false;
  }

  equalPath(otherPath: Path.PathArray) {
    return Path.equal(this.row.path, otherPath);
  }

  async expand() {
    await this.getChildren();
    this._isExpand = true;
  }

  async getChildren() {
    if (!Content.isContentDirRow(this.row)) {
      return;
    }

    if (!this._dirty) {
      return this._cache;
    }

    if (this._dirtyChildren) {
      this._cache = (await this.row.getChildren()).map((c: T) => new Content<T>(c)) ?? [];

      this._dirtyChildren = false;
      this._dirtyFilter = true;
      this._dirtySort = true;
    }

    if (this._dirtyFilter && this._filterer) {
      this._view = this._cache?.filter(this._filterer);
      this._dirtyFilter = false;
    }
    if (this._dirtySort && this._sorter) {
      this._view = this.view?.sort(this._sorter);
      this._dirtySort = false;
    }

    return this.view;
    // return this._children?.values();
  }

  getPathAtDepth(depth = 0, fill?: string) {
    const pth = this.row.path.slice(depth);

    if (fill !== undefined && pth.length > 1) {
      return [...Array(pth.length - 1).fill(fill), pth[pth.length - 1]];
    } else {
      return pth;
    }
  }

  async getTree(_flat: Content<T>[] = []) {
    if (this.isExpand) {
      for (const child of await this.getChildren() ?? []) {
        if (child.isExpand) {
          child.getTree(_flat);
        }

        _flat.push(child);
      }
    }

    return _flat;
  }

  invalidate() {
    [this._dirtyChildren, this._dirtyFilter, this._dirtySort] = [true, true, true];
  }

  /**
   * returns the raw children array fetched by getChildren
   */
  get cache() {
    return this._cache;
  }

  get isExpand() {
    return this._isExpand;
  }

  get nchildren() {
    return this._cache?.length ?? 0;
    // return this._children?.size ?? 0;
  }

  get name() {
    return (this.row.path && this.row.path.length) ? this.row.path[this.row.path.length - 1] : "";
  }

  get pathstr() {
    return this.row.path.join("/");
  }

  /**
   * like cache but filtered, sorted, etc
   */
  get view() {
    return this._view ?? this._cache;
  }

  protected get _dirty() {
    return this._dirtyChildren || this._dirtyFilter || this._dirtySort;
  }

  set filterer(filterer: Content.Filterer<T> | undefined) {
    this._filterer = filterer;
    this._dirtyFilter = true;
  }

  set sorter(sorter: Content.Sorter<T> | undefined) {
      this._sorter = sorter;
      this._dirtySort = true;
  }

  readonly isDir: boolean;
  readonly row: T;

  protected _isExpand: boolean = false;

  protected _cache?: Content<T>[];
  protected _view?: Content<T>[];
  protected _viewTree?: Content<T>[];

  protected _dirtyChildren: boolean = true;
  protected _dirtyFilter: boolean = true;
  protected _dirtySort: boolean = true;

  protected _filterer?: Content.Filterer<T>;
  protected _sorter?: Content.Sorter<T>;
}

export namespace Content {
  export type Filterer<T extends IContentRow> = (c: Content<T>) => boolean;
  export type Sorter<T extends IContentRow> = (l: Content<T>, r: Content<T>) => number;

  export function blank<T extends IContentRow>(cols: (keyof T)[]) {
    return new Content(cols.reduce((x, col) => {
      if(col === "path") {
        x["path"] = [];
      } else {
        x[col] = "" as any;
      }
      return x;
    }, {} as T));
  }

  export function isContentDirRow<T extends IContentRow, U extends IContentDirRow>(x: T | U): x is U {
    return x.kind === "dir";
  }
}
