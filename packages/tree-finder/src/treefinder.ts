/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { DEFAULT_COL, Content, IContentRow } from "./content";
import { ContentsModel } from "./model";
import { RegularTable } from "./util";

// await customElements.whenDefined('regular-table');
const RegularTableElement = customElements.get('regular-table');

const DATE_FORMATTER = new Intl.DateTimeFormat("en-us");

export class TreeFinderElement<T extends IContentRow> extends RegularTableElement {
  async init(model: ContentsModel<T>, options: Partial<TreeFinderElement.IOptions<T>> = {}) {
    const {
      doWindowReize = false,
    } = options;
    this.options = {
      doWindowReize,
    }

    this.model = model;
    this.setDataListener((x0: number, y0: number, x1: number, y1: number) => this.dataListener(x0, y0, x1, y1));

    // run listener initializations only once
    if (!this._initializedListeners) {
      this.addStyleListener(() => this.columnHeaderStyleListener())
      this.addStyleListener(() => this.styleListener());

      this.addEventListener("mousedown", event => this.onSortClick(event));
      this.addEventListener("mousedown", event => this.onTreeClick(event));
      this.addEventListener("dblclick", event => this.onRowDoubleClick(event));
      // this.addEventListener("scroll", () => (this as any)._resetAutoSize());

      // click debug listener
      // this.addEventListener("mousedown", event => RegularTable.clickLoggingListener(event, this));

      if (this.options.doWindowReize) {
        // resize whenever window size changes, if requested
        window.addEventListener('resize', async () => {
          await (this as any).draw();
        });
      }

      this._initializedListeners = true;
    }

    await (this as any).draw();
  }

  async dataListener(start_col: number, start_row: number, end_col: number, end_row: number) {
    const data = [];
    for (let cix = start_col; cix < end_col - 1; cix++) {
      const name = this.model.columns[cix];
      data.push(
        this.model.contents.slice(start_row, end_row).map((c) => {
          const val = c.row[name];
          return val instanceof Date ? DATE_FORMATTER.format(val) : val;
        })
      );
    }

    // num_columns/rows: number -> count of cols/rows
    // column/row_headers: string[] -> arrays of path parts that get displayed as the first value in each col/row. Length > 1 implies a tree structure
    return {
      num_columns: this.model.columns.length,
      num_rows: this.model.contents.length,
      column_headers: this.model.columns.map(col => [col]),
      row_headers: this.model.contents.slice(start_row, end_row).map((x) => [Tree.treeHeader(x, this.model.pathDepth)]),
      data,
    };
  }

  styleListener() {
    // // style the column header sort carets
    // const ths = this.querySelectorAll("thead th");
    // for (const th of ths) {
    //   const column_name: keyof T = this.getMeta(th as HTMLTableCellElement)?.column_header?.[0] as any;
    //   if (column_name) {
    //     const sort_dir = this.sortOrderByColName[column_name === "0" ? "path" : column_name];
    //     th.classList.toggle(`tf-sort-${sort_dir}`, !!sort_dir);
    //   }
    // }

    const trs = this.querySelectorAll("tbody tr");
    for (const tr of trs) {
      // style the browser's filetype icons
      const row_name_node = tr.children[0].querySelector(".pd-group-name") as HTMLElement;

      const text = tr.children[this.model.ixByColumn["kind"]].textContent;
      row_name_node.classList.add("tf-browser-filetype-icon", `tf-browser-${text}-icon`);
    }
  }

  columnHeaderStyleListener() {
    const header_depth = (this as any)._view_cache.config.row_pivots.length - 1;

    for (const th of this.querySelectorAll("thead tr:last-child th")) {
      const {column_header, row_header_x, x}: {column_header: object[], row_header_x: number, x: number} = this.getMeta(th as HTMLTableCellElement) as any;

      const columnName: keyof T = column_header[column_header.length - 1] as any;
      if (columnName) {
        const sortOrder = this.model.sortStates.byColumn[columnName === "0" ? "path" : columnName]?.order;
        th.classList.toggle(`tf-header-sort-${sortOrder}`, !!sortOrder);
      }

      // const sort = (this as any)._config.sort.find((x: any) => x[0] === metadata?.column_header?.[metadata?.column_header?.length - 1]);

      let needs_border = row_header_x === header_depth;
      // needs_border = needs_border || (x + 1) % (this as any)._config.columns.length === 0;
      th.classList.toggle("tf-header-border", needs_border);
      th.classList.toggle("tf-header-corner", typeof x === "undefined");

      th.classList.toggle("tf-header", true);
      th.classList.toggle("tf-header-align-left", true);
    }
  }

  onSortClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    const element = event.target as HTMLTableCellElement;
    if (element.classList.contains("pd-column-resize")) {
      // don't sort when the column resize handle nodes are clicked
      return;
    }

    const metadata = RegularTable.metadataFromElement(element, this);
    if (!metadata || !RegularTable.columnHeaderClicked(metadata)) {
      return;
    }

    this.model.sort({
      col: (metadata as any).value || DEFAULT_COL,
      multisort: event.shiftKey,
    });

    (this as any).draw();
  }

  onTreeClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    let element = event.target as HTMLTableCellElement;
    if (!element.classList.contains("pd-row-header-icon")) {
      // only open/close node when open/close icon is clicked
      return;
    }

    // assert that metadata exists, given element.classList check above
    const metadata = RegularTable.metadataFromElement(element, this)!;

    if (this.model.contents[metadata.y!].isOpen) {
      this.model.collapse(metadata.y!);
    } else {
      this.model.expand(metadata.y!);
    }

    (this as any)._resetAutoSize();
    (this as any).draw();
  }

  onRowDoubleClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    const element = event.target as HTMLTableCellElement;
    const metadata = RegularTable.metadataFromElement(element, this);
    if (!metadata || !RegularTable.rowClicked(metadata)) {
      return;
    }

    // event.preventDefault();
    // event.stopPropagation();
    // event.stopImmediatePropagation();
    // event.returnValue = false;

    const newRootContent = this.model.contents[metadata.y!];

    if (newRootContent.isDir) {
      this.model.setRoot(newRootContent.row);

      // .init() calls .draw()
      this.init(this.model, this.options);
    }
  }

  protected options: TreeFinderElement.IOptions<T>;
  protected model: ContentsModel<T>;

  private _initializedListeners: boolean = false;
}

export namespace TreeFinderElement {
  export interface IOptions<T extends IContentRow> {
    /**
     * if true, redraw the tree-finder element on window resize events
     */
    doWindowReize: boolean;
  }
}

namespace Tree {
  const treeTemplate = document.createElement("template");

  function treeHeaderLevels({isDir, isOpen, path}: {isDir: boolean, isOpen: boolean, path: string[]}) {
    const tree_levels = path.slice(1).map(() => '<span class="pd-tree-group"></span>');
    if (isDir) {
      const group_icon = isOpen ? "remove" : "add";
      const tree_button = `<span class="pd-row-header-icon">${group_icon} </span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  export function treeHeader<T extends IContentRow>(node: Content<T>, pathDepth: number) {
    const kind = node.row.kind;
    const path = node.getPathAtDepth(pathDepth);

    const name = path.length === 0 ? "TOTAL" : path[path.length - 1];
    const header_classes = kind === "text" ? "pd-group-name pd-group-leaf" : "pd-group-name";
    const tree_levels = treeHeaderLevels({isDir: node.isDir, isOpen: node.isOpen, path});
    const header_text = name;
    treeTemplate.innerHTML = `<span class="pd-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;
    return treeTemplate.content.firstChild;
  }
}
