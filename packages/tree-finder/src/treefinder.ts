/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { DEFAULT_COL, Content, IContentRow } from "./content";
import { DEFAULT_SORT_ORDER, ISortState, sortContentRoot, SortOrder } from "./sort";

// await customElements.whenDefined('regular-table');
const RegularTableElement = customElements.get('regular-table');

const DATE_FORMATTER = new Intl.DateTimeFormat("en-us");

export class TreeFinderElement<T extends IContentRow> extends RegularTableElement {
  async init(root: T, options: Partial<TreeFinderElement.IOptions<T>> = {}) {
    this.root = new Content(root);
    this._pathDepth = this.root.row.path.length;

    const {
      columnNames = Object.keys(this.root.row) as (keyof T)[],
      refresh = false
    } = options;
    this.options = {
      columnNames: columnNames.filter(x => !["path", "getChildren"].includes(x as string)),
      refresh,
    }

    // build a columnName -> columnIx table; add 1 to account for leading "path" column
    this._columnIx = Object.fromEntries(this.options.columnNames.map((x, ix) => [x, ix + 1])) as {[k in keyof T]: number};

    // fetch root's children and mark it as open
    this.root.open(this.options.refresh);

    // set initial sort
    const DEFAULT_SORT_STATES: ISortState<T>[] = [{col: DEFAULT_COL, order: DEFAULT_SORT_ORDER}];
    [this.contents, this.sortStates] = sortContentRoot({root: this.root, sortStates: DEFAULT_SORT_STATES});

    this.setDataListener((start_col: number, start_row: number, end_col: number, end_row: number) => this.model(start_col, start_row, end_col, end_row));
    this.addEventListener("mousedown", event => this.onSortClick(event));
    this.addEventListener("mousedown", event => this.onTreeClick(event));
    this.addEventListener("dblclick", event => this.onRowDoubleClick(event));
    this.addStyleListener(() => this.styleModel());

    await (this as any).draw();
  }

  // splice out the contents of the collapsed node and any expanded subnodes
  async collapse(rix: number) {
    const content = this.contents[rix];

    let npop = content.children?.length ?? 0;
    let check_ix = rix + 1 + npop;
    while (this.contents[check_ix++].row.path.length > content.row.path.length) {
      npop++;
    }
    this.contents.splice(rix + 1, npop);

    content.close();
  }

  async expand(rix: number) {
    const content = this.contents[rix];
    content.open(this.options.refresh);

    const [nodeContents, _] = sortContentRoot({root: this.contents[rix], sortStates: this.sortStates});
    this.contents.splice(rix + 1, 0, ...nodeContents);
  }

  treeHeaderLevels({isDir, isOpen, path}: {isDir: boolean, isOpen: boolean, path: string[]}) {
    const tree_levels = path.slice(1).map(() => '<span class="pd-tree-group"></span>');
    if (isDir) {
      const group_icon = isOpen ? "remove" : "add";
      const tree_button = `<span class="pd-row-header-icon">${group_icon} </span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  treeHeader(node: Content<T>) {
    const kind = node.row.kind;
    const path = node.getPathAtDepth(this._pathDepth);

    const name = path.length === 0 ? "TOTAL" : path[path.length - 1];
    const header_classes = kind === "text" ? "pd-group-name pd-group-leaf" : "pd-group-name";
    const tree_levels = this.treeHeaderLevels({isDir: node.isDir, isOpen: node.isOpen, path});
    const header_text = name;
    this._template.innerHTML = `<span class="pd-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;
    return this._template.content.firstChild;
  }

  async model(start_col: number, start_row: number, end_col: number, end_row: number) {
    const data = [];
    for (let cix = start_col; cix < end_col - 1; cix++) {
      const name = this.options.columnNames[cix];
      data.push(
        this.contents.slice(start_row, end_row).map((c) => {
          const val = c.row[name];
          return val instanceof Date ? DATE_FORMATTER.format(val) : val;
        })
      );
    }

    return {
      num_rows: this.contents.length,
      num_columns: this.options.columnNames.length,
      column_headers: this.options.columnNames.map(col => [col]),
      row_headers: this.contents.slice(start_row, end_row).map((x) => [this.treeHeader(x)]),
      data,
    };
  }

  styleModel() {
    // style the column header sort carets
    const ths = this.querySelectorAll("thead th");
    for (const th of ths) {
      const column_name: keyof T = this.getMeta(th as HTMLTableCellElement)?.column_header?.[0] as any;
      if (column_name) {
        const sort_dir = this.sortOrderByColName[column_name === "0" ? "path" : column_name];
        th.classList.toggle(`tf-sort-${sort_dir}`, !!sort_dir);
      }
    }

    const trs = this.querySelectorAll("tbody tr");
    for (const tr of trs) {
      // style the browser's filetype icons
      const row_name_node = tr.children[0].querySelector(".pd-group-name") as HTMLElement;

      const text = tr.children[this._columnIx["kind"]].textContent;
      row_name_node.classList.add("tf-browser-filetype-icon", `tf-browser-${text}-icon`);
    }
  }

  onSortClick(event: MouseEvent) {
    const target = event.target as HTMLTableCellElement;
    const metadata = this.getMeta(target);

    if (metadata?.hasOwnProperty('column_header')) {
      // event.stopPropagation();
      // event.returnValue = false;

      // .value isn't included in the jsdocs for MetaData, and so isn't in the typings
      const col = (metadata as any).value || DEFAULT_COL;
      const multisort = event.shiftKey;

      this.root.open(this.options.refresh);

      [this.contents, this.sortStates] = sortContentRoot({root: this.root, sortStates: this.sortStates, col, multisort});

      // .draw not in the RegularTableElement jsdocs/typings
      (this as any).draw({invalid_viewport: true});
    }
  }

  onRowDoubleClick(event: MouseEvent) {
    let target = event.target as HTMLTableCellElement;

    if (target.tagName === "SPAN" && target.className === "pd-row-header-icon") {
      return;
    }

    event.stopPropagation();
    // event.stopImmediatePropagation();
    event.returnValue = false;

    let metadata = this.getMeta(target);
    while (!metadata && target.parentElement) {
      target = target.parentElement as HTMLTableCellElement;
      metadata = this.getMeta(target);
    }

    if (metadata?.hasOwnProperty('column_header')) {
      return;
    }

    // .init() calls .draw()
    this.init(this.contents[metadata.y!].row, this.options);
  }

  onTreeClick(event: MouseEvent) {
    let target = event.target as HTMLTableCellElement;
    if (target.tagName === "SPAN" && target.className === "pd-row-header-icon") {

      // event.stopPropagation();
      // event.returnValue = false;

      let metadata = this.getMeta(target);
      while (!metadata && target.parentElement) {
        target = target.parentElement as HTMLTableCellElement;
        metadata = this.getMeta(target);
      }

      if (this.contents[metadata.y!].isOpen) {
        this.collapse(metadata.y!);
      } else {
        this.expand(metadata.y!);
      }

      (this as any).draw({invalid_viewport: true});
    }
  }

  protected get sortOrderByColName() {
    type SortOrderByColName = {[k in keyof T]: SortOrder};
    return this.sortStates.reduce((obj, state) => {obj[state.col] = state.order; return obj;}, {} as SortOrderByColName);
  }

  protected contents: Content<T>[] = [];
  protected options: TreeFinderElement.IOptions<T>;
  protected root: Content<T>;
  protected sortStates: ISortState<T>[] = [];

  private _columnIx: {[k in keyof T]: number};
  private _pathDepth: number;
  private _template = document.createElement("template");
}

export namespace TreeFinderElement {
  export interface IOptions<T extends IContentRow> {
    columnNames: (keyof T)[];

    refresh: boolean;
  }
}