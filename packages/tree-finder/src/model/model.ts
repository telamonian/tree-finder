/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { BehaviorSubject, Subject } from "rxjs";

import { Content, IContentRow } from "../content";
import {
  filterContentRoot,
  FilterPatterns,
  filterSortContentRoot,
  SortStates
} from "../filtersort";
import { Path } from "../util";

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
    this.crumbModel = new CrumbModel<T>();
    this._filterPatterns = new FilterPatterns();
    this._parentMap = new WeakMap();
    this._sortStates = new SortStates();

    this.options = options;

    this.crumbModel.revertedCrumbSub.subscribe(async x => {
      if (x) {
        await this.open(x);
        this.requestDraw({autosize: true});
      }
    });

    // infrastructural subscriptions
    this.openSub.subscribe(rows => rows.map(row => this.openDir(row)));
    this.refreshSub.subscribe(rows => {this._invalidate(rows); this.sort();});
    this.renamerSub.subscribe(() => this._renamerPath = null);

    this.open(root);
  }

  async open(...root: T[]): Promise<void> {
     this.openSub.next(root);
  }

  async openDir(root: T) {
    if (root.kind !== "dir") {
      return;
    }

    this._contents = [];

    const newCrumbs = [root];
    while (this._parentMap.has(newCrumbs[0])) {
      newCrumbs.unshift(this._parentMap.get(newCrumbs[0])!);
    }
    this.crumbModel.extend(newCrumbs);

    this._parentMap = new WeakMap();
    this._root = new Content({row: root});

    this.initColumns();

    await this._root.getChildren();

    // sort calls requestDraw
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
    content.collapse();

    this.requestDraw({autosize: true});
  }

  async expand(rix: number) {
    const content = this._contents[rix];

    content.expand();
    for (const child of await content?.getChildren() ?? []) {
      this._parentMap.set(child.row, content.row);
    }

    let nodeContents
    [nodeContents, this._sortStates] = await filterSortContentRoot({
      filterPatterns: this._filterPatterns,
      pathDepth: this.pathDepth,
      root: content,
      sortStates: this._sortStates,
    });
    this._contents.splice(rix + 1, 0, ...nodeContents);

    this.requestDraw({autosize: true});
  }

  async filter(props: {autosize?: boolean} = {}) {
    const {autosize = true} = props;
    await this._root.expand();

    this._contents = await filterContentRoot({
      filterPatterns: this._filterPatterns,
      root: this._root,
    });

    this.requestDraw({autosize});
  }

  onFilterInput(fpat: {col: keyof T, pattern: string}) {
    this._filterPatterns.set(fpat);

    this.filter();
  }

  renamerTest(x: Content<T>): boolean {
    return this._renamerPath !== null ? x.equalPath(this._renamerPath) : false;
  }

  requestDraw(props: {autosize?: boolean, delay?: number} = {}) {
    const {autosize = false} = props;
    if (props.delay) {
      // request draw in the future via a setTimeout
      const {delay, ...propsWithoutDelay} = props;
      setTimeout(() => this.requestDraw(propsWithoutDelay), delay);
    }

    this.drawSub.next(autosize);
  }

  async sort(props: {autosize?: boolean, col?: keyof T, multisort?: boolean} = {}) {
    const {autosize = false, col, multisort} = props;
    await this._root.expand();

    [this._contents, this._sortStates] = await filterSortContentRoot({
      col,
      filterPatterns: this._filterPatterns,
      multisort,
      root: this._root,
      sortStates: this._sortStates,
    });

    this.requestDraw({autosize});
  }

  protected _invalidate(rows?: T[]) {
    if (!rows) {
      this._root.invalidate();
      // invalidate all visible dirs in contents
    } else {
      // invalidate parents of normal files
      const invalidatedPathSet = new Set(rows.map(r => r.getChildren ? r.path.join("/") : r.path.slice(0, -1).join("/")));
      this.contents.filter(c => invalidatedPathSet.has(c.pathstr)).forEach(c => c.invalidate());
    }
  }

  get columns() {
    return this._columns;
  }

  get contents() {
    if (this.isBlank) {
      // return a content with a blank row as a fallback
      return [Content.blank(["path", ...this._columns])];
    }

    return this._contents;
  }

  get filterPatterns() {
    return this._filterPatterns;
  }

  get isBlank() {
    return !this._contents.length && this._columns.length;
  }

  get ixByColumn() {
    return this._ixByColumn;
  }

  get options() {
    return {...this._options};
  }

  set options({
    columnNames,
    doRefetch = false,
    needsWidths = false,
  }: ContentsModel.IOptions<T>) {
    this._options = {
      columnNames,
      doRefetch,
      needsWidths,
    }
  }

  get pathDepth() {
    return this._root.row.path.length;
  }

  set renamerPath(path: Path.PathArray | null) {
    this._renamerPath = path;
  }

  get root() {
    return this._root;
  }

  get selection(): Content<T>[] {
    return this.selectionModel.get(this._contents);
  }

  get selectedLast(): Content<T> | null {
    return this.selectionModel.getLast(this._contents);
  }

  get sortStates() {
    return this._sortStates;
  }

  // readonly colSizeObserver = new ResizeObserver(xs => {
  //   for (let x of xs) {
  //     for (const th of x.target.querySelectorAll("thead tr:last-child th")) {
  //       (th as HTMLElement).style.minWidth;
  //     }
  //   }
  //   console.log('Size changed');
  // });

  filterCol?: keyof T;

  readonly columnWidthsSub = new BehaviorSubject<string[]>([]);
  readonly drawSub = new BehaviorSubject<boolean>(false);
  readonly openSub = new Subject<T[]>();
  readonly refreshSub = new Subject<T[]>();
  readonly renamerSub = new Subject<ContentsModel.IRenamer<T>>();

  readonly crumbModel: CrumbModel<T>;
  readonly selectionModel = new SelectionModel<T>();

  protected _columns: (keyof T)[];
  protected _contents: Content<T>[];
  protected _filterContents: Content<T>[];
  protected _filterPatterns: FilterPatterns<T>;
  protected _parentMap: ContentsModel.RefMap<T>;
  protected _renamerPath: Path.PathArray | null = null;
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

  export interface IRenamer<T extends IContentRow> {
    name: string;
    target: Content<T>;
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
    this._lastPathstr = null;
    this.selection = new Set<string>();
  }

  get(contents: Content<T>[]): Content<T>[] {
    return contents.filter(c => this.has(c));
  }

  getLast(contents: Content<T>[]): Content<T> | null {
    if (!this._lastPathstr) {
      return null;
    }

    for (let i = 0; i < contents.length; i++) {
      if (contents[i].pathstr === this._lastPathstr) {
        return contents[i];
      }
    }

    return null;
  }

  has(content: Content<T>) {
    return this.selection.has(content.pathstr);
  }

  select(lastContent: Content<T>, add: boolean = false) {
    if (!add) {
      this.clear();
    } else {
      this.range = [];
    }

    this._lastPathstr = lastContent.pathstr;

    if (this.selection.has(this._lastPathstr)) {
      this.selection.delete(this._lastPathstr);
    } else {
      this.selection.add(this._lastPathstr);
    }

    this.pivot = this.selection.size > 0 ? this._lastPathstr : null;
  }

  selectRange(lastContent: Content<T>, contents: Content<T>[]) {
    for (const pathstr of this.range) {
      // pivot around any existing range
      this.selection.delete(pathstr);
    }

    this.range = SelectionModel.findRange(this.pivot, lastContent.pathstr, contents.map(c => c.pathstr));
    for (const pathstr of this.range) {
      this.selection.add(pathstr);
    }
  }

  get lastPathstr(): string | null {
    return this._lastPathstr;
  }

  protected _lastPathstr: string | null;
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