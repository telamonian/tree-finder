/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */
export const DEFAULT_COL = "path";

 export type Path = string[];

export interface IContentRow {
  path: Path;
  kind: string;
  getChildren?: () => IContentRow[];
}


export class Content<T extends IContentRow> {
  constructor(row: T) {
    this.isDir = row.kind === "dir";
    this.row = row;
  }

  close() {
    this._isOpen = false;
  }

  fetchChildren(refresh: boolean = false) {
    if (!this.isDir || (!refresh && this._children)) {
      return;
    }

    this._children = this.row.getChildren!().map((c: T) => new Content<T>(c));
  }

  open(refresh: boolean = false) {
    this.fetchChildren(refresh)
    this._isOpen = true;
  }

  get children() {
    return this._children;
  }

  get isOpen() {
    return this._children
  }

  readonly isDir: boolean;
  readonly row: T;

  protected _children?: Content<T>[];
  protected _isOpen: boolean = false;
}
