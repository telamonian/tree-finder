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

export class Content<T extends IContentRow> {
  constructor({row, filterer, sorter}: {row: T, filterer?: Content.Filterer<T>, sorter?: Content.Sorter<T>}) {
    this.init({row, filterer, sorter});
  }

  init({row, filterer, sorter}: {row: T, filterer?: Content.Filterer<T>, sorter?: Content.Sorter<T>}) {
    this.row = row;

    this.filterer = filterer;
    this.sorter = sorter;

    return this;
  }

  collapse() {
    this._isExpand = false;
  }

  equalPath(otherPath: Path.PathArray) {
    return Path.equal(this.row.path, otherPath);
  }

  async expand() {
    this._isExpand = true;
    await this.getChildren();
  }

  async getChildren() {
    // isContentDirRow is a typeguard that asserts that T extends IContentDirRow
    if (!this._row.getChildren) {
      return;
    }

    if (this._dirtyChildren) {
      if (this._cacheMap) {
        // attempt to reseat existing Content row
        this._cache = (await this._row.getChildren()).map((row: T) => this._cacheMap!.get(row.path.join("/"))?.init({row, sorter: this._sorter}) ?? new Content<T>({row, sorter: this._sorter}));
      } else {
        this._cache = (await this._row.getChildren()).map((row: T) => new Content<T>({row, sorter: this._sorter}));
      }
      this._cacheMap = new Map(this._cache.map(x => [x.pathstr, x]));

      this._dirtyChildren = false;
      this._dirtySort = !!this._sorter;
    }

    if (this._dirtySort) {
      this._cache!.sort(this._sorter);
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
    if (this.hasChildren) {
      for (const child of (await this.getChildren())!) {
        _flat.push(child);
        if (child.isExpand) {
          await child._flatten(_flat);
        }
      }
    }

    return _flat;
  }

  async flatten(): Promise<Content<T>[]> {
    return this._filterer ? (await this._flatten()).filter(this._filterer) : await this._flatten();
  }

  /**
   * If _recursive, mark any subcache as invalid as well
   */
  invalidate(_recursive = false) {
    if (this.hasChildren) {
      [this._dirtyChildren, this._dirtySort] = [true, false];
      if (_recursive && this._cache) {
        for (const child of this._cache) {
          child.invalidate(_recursive);
        }
      }
    }
  }

  get hasChildren() {
    return this._hasChildren;
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

  set row(row: T) {
    this._row = row;
    this._hasChildren = !!(this._row.getChildren);
    this._pathstr = this._row.path.join("/");

    this.invalidate();
}

  set filterer(filterer: Content.Filterer<T> | undefined) {
    this._filterer = filterer;
    // this._dirtyFilter = !!filterer;
  }

  set sorter(sorter: Content.Sorter<T> | undefined) {
    this._sorter = sorter;
    this._dirtySort = !!(sorter && this._cache);

    if (this._cache) {
      for (const child of this._cache) {
        child.sorter = sorter;
      }
    }
  }

  protected get _dirty() {
    return this._dirtyChildren || this._dirtySort; //|| this._dirtyFilter;
  }

  protected _row: T;

  protected _hasChildren: boolean = false;
  protected _isExpand: boolean = false;
  protected _name: string;
  protected _pathstr: string;

  protected _cache?: Content<T>[];
  protected _cacheMap?: Map<string, Content<T>>;

  protected _dirtyChildren: boolean = false;
  // protected _dirtyFilter: boolean = false;
  protected _dirtySort: boolean = false;

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
}
