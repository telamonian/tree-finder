/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { BehaviorSubject } from "rxjs";

import { Content, IContentRow } from "./content";
import { SortStates, sortContentRoot} from "./sort";

export class ContentsModel<T extends IContentRow> {
  constructor(root?: T, options: Partial<ContentsModel.IOptions<T>> = {}) {
    this.options = options;

    this.reset();

    if (root) {
      this.setRoot(root);
    }
  }

  reset(crumbIx?: number) {
    this._contents = [];

    if (!crumbIx) {
      this._crumbs = [];
      this.crumbSubject.next(this._crumbs.map(x => x.name));
      return;
    }

    const rootContent = this._crumbs[crumbIx];
    this._crumbs = this._crumbs.slice(0, crumbIx);
    this.setRoot(rootContent.row);
  }

  setRoot(root: T) {
    this._sortStates = new SortStates();
    this._root = new Content(root);

    this._crumbs.push(this._root);
    this.crumbSubject.next(this._crumbs.map(x => x.name));

    this.initColumns();

    // fetch root's children and mark it as open
    this._root.open(this._options.doRefetch);

    // set initial sort
    this.sort();
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
    content.open(this._options.doRefetch);

    const [nodeContents, _] = sortContentRoot({root: this._contents[rix], sortStates: this._sortStates});
    this._contents.splice(rix + 1, 0, ...nodeContents);
  }

  sort(props: {col?: keyof T, multisort?: boolean} = {}) {
    const {col, multisort} = props;

    this._root.open(this._options.doRefetch);

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

  readonly crumbSubject = new BehaviorSubject([] as string[]);

  protected _columns: (keyof T)[];
  protected _contents: Content<T>[];
  protected _crumbs: Content<T>[];
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
}
