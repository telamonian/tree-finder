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
  constructor({row, filterer, sorter}: {row: T, filterer?: Content.Filterer<T>, sorter?: Content.Sorter<T>}) {
    this.init({row, filterer, sorter});
  }

  init({row, filterer, sorter}: {row: T, filterer?: Content.Filterer<T>, sorter?: Content.Sorter<T>}) {
    this._row = row;
    this._isDir = this._row.kind === "dir";
    this._pathstr = this._row.path.join("/");

    this.filterer = filterer;
    this.sorter = sorter;
  }

  collapse() {
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
    // isContentDirRow is a typeguard that asserts that T extends IContentDirRow
    if (!Content.isContentDirRow(this.row)) {
      return;
    }

    if (!this._dirty) {
      return this._cache;
    }

    if (this._cache && this._dirtySort) {
      this._cache.sort(this._sorter);
    }

    if (this._dirtyChildren) {
      this._cache = (await this.row.getChildren()).map((row: T) => new Content<T>({row, sorter: this._sorter}));
      if (this._sorter) {
        this._cache.sort(this._sorter);
      }

      this._dirtyChildren = false;
      this._dirtySort = false;
    }

    if (this._cache && this._dirtySort) {
      this._cache.sort(this._sorter);
    }

    return this._cache;
  }

  getPathAtDepth(depth = 0, fill?: string) {
    const pth = this.row.path.slice(depth);

    if (fill !== undefined && pth.length > 1) {
      return [...Array(pth.length - 1).fill(fill), pth[pth.length - 1]];
    } else {
      return pth;
    }
  }

  protected async _flatten(_flat: Content<T>[] = []): Promise<Content<T>[]> {
    if (this.isExpand) {
      for (const child of await this.getChildren() ?? []) {
        if (child.isExpand) {
          child._flatten(_flat);
        }

        _flat.push(child);
      }
    }

    return _flat;
  }

  async flatten(): Promise<Content<T>[]> {
    return this._filterer ? (await this._flatten()).filter(this._filterer) : this._flatten();
  }

  invalidate() {
    [this._dirtyChildren, this._dirtySort] = [true, true];
  }

  /**
   * returns the raw children array fetched by getChildren
   */
  get cache() {
    return this._cache;
  }

  get isDir() {
    return this._isDir;
  }

  get isExpand() {
    return this._isExpand;
  }

  get nchildren() {
    return this._cache?.length ?? 0;
    // return this._children?.size ?? 0;
  }

  get name() {
    return this.row.path.slice(-1)[0];
  }

  get pathstr() {
    return this._pathstr;
  }

  get row() {
    return this._row;
  }

  set filterer(filterer: Content.Filterer<T> | undefined) {
    this._filterer = filterer;
    // this._dirtyFilter = !!filterer;
  }

  set sorter(sorter: Content.Sorter<T> | undefined) {
      this._sorter = sorter;
      this._dirtySort = !!sorter;

      for (const child of this._cache ?? []) {
        child.sorter = sorter;
      }
  }

  protected get _dirty() {
    return this._dirtyChildren || this._dirtySort; //|| this._dirtyFilter;
  }

  protected _row: T;

  protected _isDir: boolean;
  protected _isExpand: boolean = false;
  protected _name: string;
  protected _pathstr: string;

  protected _cache?: Content<T>[];

  protected _dirtyChildren: boolean = true;
  // protected _dirtyFilter: boolean = true;
  protected _dirtySort: boolean = true;

  protected _filterer?: Content.Filterer<T>;
  protected _sorter?: Content.Sorter<T>;
}

export namespace Content {
  export type Filterer<T extends IContentRow> = (c: Content<T>) => boolean;
  export type Sorter<T extends IContentRow> = (l: Content<T>, r: Content<T>) => number;

  export function blank<T extends IContentRow>(cols: (keyof T)[]) {
    return new Content({row: cols.reduce((x, col) => {
      if(col === "path") {
        x["path"] = [];
      } else {
        x[col] = "" as any;
      }
      return x;
    }, {} as T)});
  }

  export function isContentDirRow<T extends IContentRow, U extends IContentDirRow>(x: T | U): x is U {
    return x.kind === "dir";
  }
}
