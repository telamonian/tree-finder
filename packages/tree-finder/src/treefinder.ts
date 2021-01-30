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
  async init(root: T, options: TreeFinderElement.IOptions<T> = {}) {
    this.root = new Content(root);

    const {
      columnNames = Object.keys(this.root.row) as (keyof T)[],
      refresh = false
    } = options;
    this.columnNames = columnNames.filter(x => !["path", "getChildren"].includes(x as string));
    this.refresh = refresh;

    // fetch root's children and mark it as open
    this.root.open();

    // set initial sort
    const DEFAULT_SORT_STATES: ISortState<T>[] = [{col: DEFAULT_COL, order: DEFAULT_SORT_ORDER}];
    [this.contents, this.sortStates] = sortContentRoot({root: this.root, sortStates: DEFAULT_SORT_STATES});

    this.setDataListener((start_col: number, start_row: number, end_col: number, end_row: number) => this.model(start_col, start_row, end_col, end_row));
    this.addEventListener("mousedown", event => this.onSortClick(event));
    this.addEventListener("mousedown", event => this.onTreeClick(event));
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
    content.open();

    const [nodeContents, _] = sortContentRoot({root: this.contents[rix], sortStates: this.sortStates});
    this.contents.splice(rix + 1, 0, ...nodeContents);
  }

  treeHeaderLevels(node: Content<T>) {
    const tree_levels = node.row.path.slice(1).map(() => '<span class="pd-tree-group"></span>');
    if (node.isDir) {
      const group_icon = node.isOpen ? "remove" : "add";
      const tree_button = `<span class="pd-row-header-icon">${group_icon} </span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  treeHeader(node: Content<T>) {
    const {path, kind: kind} = node.row;

    const name = path.length === 0 ? "TOTAL" : path[path.length - 1];
    const header_classes = kind === "text" ? "pd-group-name pd-group-leaf" : "pd-group-name";
    const tree_levels = this.treeHeaderLevels(node);
    const header_text = name;
    this._template.innerHTML = `<span class="pd-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;
    return this._template.content.firstChild;
  }

  async model(start_col: number, start_row: number, end_col: number, end_row: number) {
    const column_names = this.columnNames;

    const data = [];
    for (let cix = start_col; cix < end_col - 1; cix++) {
      const name = column_names[cix];
      data.push(
        this.contents.slice(start_row, end_row).map((c) => {
          const val = c.row[name];
          return val instanceof Date ? DATE_FORMATTER.format(val) : val;
        })
      );
    }

    return {
      num_rows: this.contents.length,
      num_columns: column_names.length,
      column_headers: column_names.map(col => [col]),
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
        th.className = sort_dir ? `tf-sort-${sort_dir}` : "";
      }
    }

    const trs = this.querySelectorAll("tbody tr");
    for (const tr of trs) {
      // style the browser's filetype icons
      const {children} = tr;
      const row_name_node = children[0].querySelector(".pd-group-name") as HTMLElement;
      for (let i = 1; i < children.length; i++) {
        const text = children[i].textContent;
        if (text === "dir") {
          row_name_node.classList.add("tf-browser-filetype-icon", "tf-browser-dir-icon");
          break;
        } else if (text === "text") {
          row_name_node.classList.add("tf-browser-filetype-icon", "tf-browser-text-icon");
          break;
        }
      }
    }
  }

  onSortClick(event: MouseEvent) {
    const target = event.target as HTMLTableCellElement;
    const metadata = this.getMeta(target);

    if (metadata?.hasOwnProperty('column_header')) {
      // .value isn't included in the jsdocs for MetaData, and so isn't in the typings
      const col = (metadata as any).value || DEFAULT_COL;
      const multisort = event.shiftKey;

      this.root.open();

      // [this.contents, SORT] = sortContentRoot(ROOT, SORT, false, column_name, multi);
      [this.contents, this.sortStates] = sortContentRoot({root: this.root, sortStates: this.sortStates, col, multisort});

      // .draw not in the RegularTableElement jsdocs/typings
      (this as any).draw({invalid_viewport: true});
    }
  }

  onRowDoubleClick(event: MouseEvent) {
    let target = event.target as HTMLTableCellElement;
    if (target.tagName === "SPAN" && target.className === "pd-row-header-icon") {
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


  onTreeClick(event: MouseEvent) {
    let target = event.target as HTMLTableCellElement;
    if (target.tagName === "SPAN" && target.className === "pd-row-header-icon") {
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

  protected columnNames: (keyof T)[];
  protected contents: Content<T>[] = [];
  protected refresh: boolean = false;
  protected root: Content<T>;
  protected sortStates: ISortState<T>[] = [];

  private _template = document.createElement("template");
}

export namespace TreeFinderElement {
  export interface IOptions<T extends IContentRow> {
    columnNames?: (keyof T)[];

    refresh?: boolean;
  }
}