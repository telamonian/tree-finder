/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { BehaviorSubject } from "rxjs";

import { Content, IContentRow } from "./content";
import { SortStates, sortContentRoot} from "./sort";

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
  constructor(root: T, options: Partial<ContentsModel.IOptions<T>> = {}) {
    this.crumbs = new CrumbModel<T>();
    this._parentMap = new WeakMap();
    this._sortStates = new SortStates();

    this.options = options;

    this.crumbs.revertedCrumbSub.subscribe(async x => {if (x) {await this.open(x)}});

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

    await this._root.expand(this._options.doRefetch);
    for (const c of this._root.children!) {
      this._parentMap.set(c.row, this._root.row);
    }

    // sort the root's contents and display
    await this.sort();
  }

  initColumns() {
    const columns = this.options.columnNames ?? Object.keys(this._root.row) as (keyof T)[];
    this._columns = columns.filter(x => !["path", "getChildren"].includes(x as string));

    // build a columnName -> columnIx table; add 1 to account for leading "path" column
    this._ixByColumn = Object.fromEntries(this._columns.map((x, ix) => [x, ix + 1])) as {[k in keyof T]: number};
  }

  // splice out the contents of the collapsed node and any expanded subnodes
  async collapse(rix: number) {
    const content = this._contents[rix];

    let npop = content.children?.length ?? 0;
    let check_ix = rix + 1 + npop;
    while (this._contents[check_ix++].row.path.length > content.row.path.length) {
      npop++;
    }
    this._contents.splice(rix + 1, npop);

    content.close();
  }

  async expand(rix: number) {
    const content = this._contents[rix];

    await content.expand(this._options.doRefetch);
    for (const c of content.children!) {
      this._parentMap.set(c.row, content.row);
    }

    const [nodeContents, _] = sortContentRoot({root: this._contents[rix], sortStates: this._sortStates});
    this._contents.splice(rix + 1, 0, ...nodeContents);
  }

  async sort(props: {col?: keyof T, multisort?: boolean} = {}) {
    const {col, multisort} = props;
    await this._root.expand(this._options.doRefetch);

    [this._contents, this._sortStates] = sortContentRoot({root: this._root, sortStates: this._sortStates, col, multisort});
  }

  get columns() {
    return this._columns;
  }

  get contents() {
    return this._contents;
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

  set options(options: Partial<ContentsModel.IOptions<T>>) {
    const {
      columnNames,
      doRefetch = false,
    } = options;
    this._options = {
      columnNames: columnNames!,
      doRefetch,
    }
  }

  get ixByColumn() {
    return this._ixByColumn;
  }

  readonly crumbs: CrumbModel<T>;

  protected _columns: (keyof T)[];
  protected _contents: Content<T>[];
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
    columnNames: (keyof T)[];

    /**
     * if true, always (re)fetch children when opening a dir
     */
    doRefetch: boolean;
  }

  export type RefMap<T extends IContentRow> = WeakMap<T, T>;
}
