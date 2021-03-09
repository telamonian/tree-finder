/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { BehaviorSubject } from "rxjs";

import { Content, IContentRow, Path } from "./content";
import {
  filterContentRoot,
  FilterPatterns,
  filterSortContentRoot,
  SortStates
} from "./filtersort";

class CrumbModel<T extends IContentRow> {
  constructor() {
    this._crumbsRows = [];

    this.crumbNamesSub = new BehaviorSubject([]);
    this.revertedCrumbSub = new BehaviorSubject(undefined);
  }

  revert(crumbIx: number) {
    this._crumbsRows = this._crumbsRows.slice(0, crumbIx + 1);
    const last = this._crumbsRows.pop();

    this.revertedCrumbSub.next(last);
    return last;
  }

  extend(crumbs: T[]) {
    this._crumbsRows = [...this._crumbsRows, ...crumbs];
    this._onCrumbUpdate();

    const last = this._crumbsRows[this._crumbsRows.length - 1];
    return last;
  }

  protected async _onCrumbUpdate() {
    this.crumbNamesSub.next(this._crumbsRows.map(r => r.path[r.path.length - 1]));
  }

  readonly crumbNamesSub: BehaviorSubject<string[]>;
  readonly revertedCrumbSub: BehaviorSubject<T | undefined>;

  protected _crumbsRows: T[] = [];
}

export class ContentsModel<T extends IContentRow> {
  constructor(root: T, options: ContentsModel.IOptions<T> = {}) {
    this.crumbs = new CrumbModel<T>();
    this._filterPatterns = new FilterPatterns();
    this._parentMap = new WeakMap();
    this._sortStates = new SortStates();

    this.options = options;

    this.crumbs.revertedCrumbSub.subscribe(async x => {
      if (x) {
        await this.open(x);
        this.requestDraw(true);
      }
    });

    this.open(root);
  }

  async open(root: T) {
    this._contents = [];

    const newCrumbs = [root];
    while (this._parentMap.has(newCrumbs[0])) {
      newCrumbs.unshift(this._parentMap.get(newCrumbs[0])!);
    }
    this.crumbs.extend(newCrumbs);

    this._parentMap = new WeakMap();
    this._root = new Content(root);

    this.initColumns();

    await this._root.expand();

    // sort the root's contents and display
    await this.sort({autosize: true});
  }

  initColumns() {
    const columns = (this.options.columnNames ?? Object.keys(this._root.row)) as (keyof T)[];
    this._columns = columns.filter(x => !["path", "getChildren"].includes(x as string));

    // build a columnName -> columnIx table; add 1 to account for leading "path" column
    this._ixByColumn = Object.fromEntries(this._columns.map((x, ix) => [x, ix + 1])) as {[k in keyof T]: number};
  }

  // splice out the contents of the collapsed node and any expanded subnodes
  async collapse(rix: number) {
    const content = this._contents[rix];

    let check_ix = rix + 1;
    let npop = 0;

    while (this._contents[check_ix] && this._contents[check_ix].row.path.length > content.row.path.length) {
      check_ix++;
      npop++;
    }

    this._contents.splice(rix + 1, npop);
    content.close();

    this.requestDraw(true);
  }

  async expand(rix: number) {
    const content = this._contents[rix];

    content.expand();
    for (const child of await content?.getChildren() ?? []) {
      this._parentMap.set(child.row, content.row);
    }

    const [nodeContents, _] = await filterSortContentRoot({root: content, filterPatterns: this._filterPatterns, sortStates: this._sortStates, pathDepth: this.pathDepth});
    this._contents.splice(rix + 1, 0, ...nodeContents);

    this.requestDraw(true);
  }

  async filter(props: {autosize?: boolean} = {}) {
    const {autosize = true} = props;
    await this._root.expand();

    this._contents = await filterContentRoot({root: this._root, filterPatterns: this._filterPatterns});

    this.requestDraw(autosize);
  }

  onFilterInput(fpat: {col: keyof T, pattern: string}) {
    this._filterPatterns.set(fpat);

    this.filter();
  }

  requestDraw(autosize = false) {
    this.drawSub.next(autosize);
  }

  async sort(props: {col?: keyof T, multisort?: boolean, autosize?: boolean} = {}) {
    const {col, multisort, autosize = false} = props;
    await this._root.expand();

    [this._contents, this._sortStates] = await filterSortContentRoot({root: this._root, filterPatterns: this._filterPatterns, sortStates: this._sortStates, col, multisort});

    this.requestDraw(autosize);
  }

  get columns() {
    return this._columns;
  }

  get contents() {
    if (!this._contents.length && this._columns.length) {
      // return a content with a blank row as a fallback
      return [Content.blank(["path", ...this._columns])];
    }

    return this._contents;
  }

  get filterPatterns() {
    return this._filterPatterns;
  }

  get pathDepth() {
    return this._root.row.path.length;
  }

  get sortStates() {
    return this._sortStates;
  }

  get root() {
    return this._root;
  }

  get options() {
    return {...this._options};
  }

  set options(options: ContentsModel.IOptions<T>) {
    const {
      columnNames,
      doRefetch = false,
      needsWidths = false,
    } = options;
    this._options = {
      columnNames,
      doRefetch,
      needsWidths,
    }
  }

  get ixByColumn() {
    return this._ixByColumn;
  }

  filterCol?: keyof T;

  readonly columnWidthsSub = new BehaviorSubject<string[]>([]);
  readonly crumbs: CrumbModel<T>;
  readonly drawSub = new BehaviorSubject<boolean>(false);
  readonly selection = new SelectionModel();

  // readonly colSizeObserver = new ResizeObserver(xs => {
  //   for (let x of xs) {
  //     for (const th of x.target.querySelectorAll("thead tr:last-child th")) {
  //       (th as HTMLElement).style.minWidth;
  //     }
  //   }
  //   console.log('Size changed');
  // });

  protected _columns: (keyof T)[];
  protected _contents: Content<T>[];
  protected _filterContents: Content<T>[];
  protected _filterPatterns: FilterPatterns<T>;
  protected _parentMap: ContentsModel.RefMap<T>;
  protected _root: Content<T>;
  protected _sortStates: SortStates<T>;

  protected _options: ContentsModel.IOptions<T>;

  private _ixByColumn: {[k in keyof T]: number};
}

export namespace ContentsModel {
  export interface IOptions<T extends IContentRow> {
    /**
     * optionally specify the visible columns, and the order they appear in
     */
    columnNames?: (keyof T)[];

    /**
     * if true, always (re)fetch children when opening a dir
     */
    doRefetch?: boolean;

    /**
     * if true, the columnWidthsSub will emit the auto column widths on each draw cycle
     */
    needsWidths?: boolean;
  }

  export type RefMap<T extends IContentRow> = WeakMap<T, T>;
}

export class SelectionModel<T extends IContentRow> {
  constructor() {
    this.clear();
  }

  clear() {
    this.pivot = null;
    this.range = [];
    this.selection = new Set<string>();
  }

  get(contents: Content<T>[]) {
    const selected: Content<T>[] = [];
    for (const content of contents) {
      if (this.has(content)) {
        selected.push(content);
      }
    }

    return selected;
  }

  has(content: Content<T>) {
    return this.selection.has(content.row.path.join("/"));
  }

  select(content: Content<T>, add: boolean = false) {
    if (!add) {
      this.clear();
    } else {
      this.range = [];
    }

    const pathstr = content.row.path.join("/")

    if (this.selection.has(pathstr)) {
      this.selection.delete(pathstr);
    } else {
      this.selection.add(pathstr);
    }

    this.pivot = this.selection.size > 0 ? pathstr : null;
  }

  selectRange(end: Content<T>, contents: Content<T>[]) {
    for (const pathstr of this.range) {
      // pivot around any existing range
      this.selection.delete(pathstr);
    }

    this.range = SelectionModel.findRange(this.pivot, end.row.path.join("/"), contents.map(c => c.row.path.join("/")));
    for (const pathstr of this.range) {
      this.selection.add(pathstr);
    }
  }

  protected range: string[];
  protected pivot: string | null;
  protected selection: Set<string>;
}

export namespace SelectionModel {
  export function findRange(start: string | null, end: string, vals: string[]) {
    if (start === end) {
      return [];
    }

    const pivotIx = start !== null ? vals.indexOf(start) : -1;
    const endIx = vals.indexOf(end);

    const range = [];
    if (pivotIx > endIx) {
      for (let i = endIx; i < pivotIx; i++) {
        range.push(vals[i]);
      }
    } else {
      for (let i = pivotIx + 1; i <= endIx; i++) {
        range.push(vals[i]);
      }
    }

    return range;
  }
}