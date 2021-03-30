/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import * as rt from "regular-table";

import { IContentRow } from "../content";
import { ContentsModel } from "../model";
import { Format, RegularTable, Tree } from "../util";

import { TreeFinderFilterElement } from "./filter";
import { TreeFinderFiltersElement } from "./filters";

// await customElements.whenDefined('regular-table');
if (document.createElement("regular-table").constructor === HTMLElement) {
  window.customElements.define("regular-table", rt.RegularTableElement);
}
const RegularTableElement = customElements.get('regular-table');

export class TreeFinderGridElement<T extends IContentRow> extends RegularTableElement {
  async init(model: ContentsModel<T>, options: TreeFinderGridElement.IOptions<T> = {}) {
    this.model = model;
    this.options = options;
    this.setDataListener((x0, y0, x1, y1) => this.dataListener(x0, y0, x1, y1) as any);

    this.model.drawSub.subscribe(async x => {
      if (x) {
        (this as any)._resetAutoSize();
      }

      await this.draw();

      if (this.model.options.needsWidths) {
        // correct handling of autowidth seems to frequently require the second draw
        await this.draw();
      }
    });

    // run listener initializations only once
    if (!this._initializedListeners) {
      const [thead, tbody] = [(this as any).table_model.header.table, (this as any).table_model.body.table] as HTMLTableSectionElement[];

      this.addStyleListener(() => this.columnHeaderStyleListener())
      this.addStyleListener(() => this.rowStyleListener());

      this.addEventListener("mouseover", event => this.onMouseover(event));

      thead.addEventListener("mouseup", event => this.onSortClick(event));

      tbody.addEventListener("dblclick", event => this.onRowDoubleClick(event));
      tbody.addEventListener("mouseup", event => this.onRowClick(event));
      tbody.addEventListener("mouseup", event => this.onTreeClick(event));
      // this.addEventListener("scroll", () => (this as any)._resetAutoSize());

      // click debug listener
      // this.addEventListener("mousedown", event => RegularTable.clickLoggingListener(event, this));

      if (this.options.doWindowReize) {
        // resize whenever window size changes, if requested
        window.addEventListener('resize', async () => {
          await this.draw();
        });
      }

      this._initializedListeners = true;
    }

    this.model.requestDraw();
  }

  async dataListener(start_col: number, start_row: number, end_col: number, end_row: number) {
    const data: T[keyof T][][] = [];
    for (let cix = start_col; cix < end_col - 1; cix++) {
      const column = this.model.columns[cix];
      const formatter = this.options?.columnFormatters?.[column] ?? (x => x);
      data.push(
        this.model.contents.slice(start_row, end_row).map(content => {
          const val = formatter(content.row[column]);
          return (val instanceof Date ? Format.DATE_FORMATTER.format(val) : val) as T[keyof T];
        })
      );
    }

    return {
      // num_columns/rows: number -> count of cols/rows
      num_columns: this.model.columns.length,
      num_rows: this.model.contents.length,

      // column/row_headers: string[] -> arrays of path parts that get displayed as the first value in each col/row. Length > 1 implies a tree structure
      column_headers: this.model.columns.slice(start_col, end_col).map((x, i) => {
        const filter = this.options.showFilter ? this.filters!.getChild(i + 1) : undefined;
        // return [Tree.colHeaderSpans(x as string, filter)];
        return [...(filter ? [filter] : []), Tree.colHeaderSpans(x as string)];
      }),
      row_headers: this.model.contents.slice(start_row, end_row).map(x => {
        return Tree.rowHeaderSpan({
          isDir: x.isDir,
          isOpen: x.isExpand,
          path: x.getPathAtDepth(this.model.pathDepth),
          pathRender: this._pathRender,
        });
      }),

      // data: object[][] -> array of arrays, each subarray containing all of the visible values for one column
      data,
    };
  }

  columnHeaderStyleListener() {
    this.cornerHeaderStyleListener();

    for (const th of (this.querySelectorAll("thead tr:first-child th") as any as HTMLTableHeaderCellElement[])) {
      th.classList.toggle("tf-header-align-left", true);

      const filter = th.querySelector("tree-finder-filter") as TreeFinderFilterElement<T>;
      if (filter) {
        filter.input.classList.toggle("tf-header-input", true);

        // ensure that filter input focus is maintained accross draw cycles
        if (this.model.filterCol === filter.col) {
          filter.input.focus();
          delete this.model.filterCol;
        }
      }
    }

    for (const th of (this.querySelectorAll("thead tr:last-child th") as any as HTMLTableHeaderCellElement[])) {
      const meta = this.getMeta(th);
      const col = RegularTable.colNameFromMeta(meta) as keyof T;

      if (col) {
        const sortOrder = this.model.sortStates.byColumn[col === "0" ? "path" : col]?.order;
        th.querySelector(".tf-header-sort")?.classList.toggle(`tf-header-sort-${sortOrder}`, !!sortOrder);
      }

      th.classList.toggle("tf-header-corner", typeof meta.x === "undefined");
      th.classList.toggle("tf-header-align-left", true);
    }

    if (this.model.options.needsWidths) {
      this.columnWidthStyleListener();
    }
  }

  columnWidthStyleListener() {
    // complete and accurate autowidth for the tree-finder-filter input elems
    let pxs = [...(this as any)._column_sizes.indices];
    if (this._pathRender === "regular" && pxs.length > 0) {
      pxs = [pxs[0] + pxs[1], ...pxs.slice(2)];
    }
    this.model.columnWidthsSub.next(pxs.map(px => `calc(${px}px - 12px)`));
  }

  cornerHeaderStyleListener() {
    const initSpans = this.querySelectorAll(`thead tr > th:first-child > span:first-child:not([class])`);
    const filter = this.options.showFilter ? this.filters!.getChild(0) : undefined;
    // const newSpans = [Tree.colHeaderSpans("path", filter)];
    const newSpans = [...(filter ? [filter] : []), Tree.colHeaderSpans("path")];

    for (let i = 0; i < initSpans.length; i++) {
      initSpans[i].replaceWith(newSpans[i]);
    }
  }

  rowStyleListener() {
    const spans = this.querySelectorAll("tbody th .rt-group-name");
    for (const span of spans) {
      // style the browser's filetype icons
      const {value, y} = RegularTable.metadataFromElement(span as HTMLTableCellElement, this)!;

      if (value) {
        const content = this.model.contents[y!];

        span.classList.add("tf-grid-filetype-icon", `tf-grid-${content.row.kind}-icon`);

        this.rowSelectStyleListener();
      }
    }
  }

  rowSelectStyleListener() {
    const colCount = this.model.columns.length + 1;
    for (let tr of (this as any).table_model.body.rows as HTMLElement[]) {
      const {y} = RegularTable.metadataFromElement(tr.children[0]!, this)!;

      if (tr && tr.tagName === "TR") {
        tr.classList.toggle("tf-mod-select", this.model.selection.has(this.model.contents[y!]));

        if (this._pathRender === "regular") {
          for (let i = 0; i < tr.children.length - colCount; i++) {
            tr.children[0].classList.toggle("tf-mod-select-not", true);
          }
        }
      }
    }
  }

  async onMouseover(event: MouseEvent) {
    if (this._pathRender === "regular") {
      const element = event.target as HTMLTableCellElement;
      const metadata = RegularTable.metadataFromElement(element, this);
      const rowHeader = metadata?.row_header?.[0] as any as string;

      for (let tr of (this as any).table_model.body.rows as HTMLElement[]) {
        if (tr.childElementCount > (this.model.columns.length + 1)) {
          const th = tr.children[0];
          th.classList.toggle("tf-mod-hover", th.textContent === rowHeader);
        }
      }
    }
  }

  async onRowClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    const element = event.target as HTMLTableCellElement;
    if (element.classList.contains("rt-row-header-icon")) {
      // if open/close icon is clicked, don't select
      return;
    }
    const metadata = RegularTable.metadataFromElement(element, this);
    if (!metadata || !RegularTable.rowClicked(metadata)) {
      return;
    }

    const content = this.model.contents[metadata.y!];

    if (event.shiftKey) {
      this.model.selection.selectRange(content, this.model.contents);
    } else {
      this.model.selection.select(content, event.ctrlKey || event.metaKey);
    }

    this.rowSelectStyleListener();

    // can't call draw directly or indirectly, breaks any subsequent doubleClick event
    // setTimeout(() => this.model.requestDraw(), 200);
  }

  async onSortClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    const element = event.target as HTMLTableCellElement;
    if (element.tagName === "INPUT" || element.classList.contains("rt-column-resize")) {
      // don't sort when the column resize handle nodes are clicked
      return;
    }

    const meta = RegularTable.metadataFromElement(element, this);
    if (!meta || !RegularTable.columnHeaderClicked(meta) || meta.column_header_y! < (this as any).table_model.header.rows.length - 1) {
      return;
    }

    await this.model.sort({
      col: RegularTable.colNameFromMeta(meta) as keyof T,
      multisort: event.shiftKey,
    });
  }

  async onTreeClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    let element = event.target as HTMLTableCellElement;
    if (!element.classList.contains("rt-row-header-icon")) {
      // only open/close node when open/close icon is clicked
      return;
    }

    // assert that metadata exists, given element.classList check above
    const metadata = RegularTable.metadataFromElement(element, this)!;

    if (this.model.contents[metadata.y!].isExpand) {
      await this.model.collapse(metadata.y!);
    } else {
      await this.model.expand(metadata.y!);
    }

    // (this as any)._resetAutoSize();
    // this.draw();
  }

  async onRowDoubleClick(event: MouseEvent) {
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
      await this.model.open(newRootContent.row);

      // .init() calls .draw()
      this.init(this.model, this.options);
    }
  }

  get options() {
    return {...this._options};
  }

  set options(options: TreeFinderGridElement.IOptions<T>) {
    const {
      columnFormatters = undefined,
      doWindowReize = false,
      pathRender = "tree",
      pathRenderOnFilter = "regular",
      showFilter = false,
    } = options;
    this._options = {
      columnFormatters,
      doWindowReize,
      pathRender,
      pathRenderOnFilter,
      showFilter,
    }

    this.showFilter = this._options.showFilter!;
  }

  set showFilter(flag: boolean) {
    if (flag) {
      this.filters = document.createElement("tree-finder-filters");
      this.filters.init(this.model);
    } else {
      delete this.filters;
    }

    this._options.showFilter = flag;
  }

  protected get _pathRender() {
    if (this.model.filterPatterns.any) {
      return this.options?.pathRenderOnFilter || "tree";
    } else {
      return this.options?.pathRender || "tree";
    }
  }

  protected _options: TreeFinderGridElement.IOptions<T>;
  protected filters?: TreeFinderFiltersElement<T>;
  protected model: ContentsModel<T>;

  private _initializedListeners: boolean = false;
}

export namespace TreeFinderGridElement {
  export interface IOptions<T extends IContentRow> {
    columnFormatters?: {[key in keyof T]?: (datum: T[key]) => any};

    /**
     * if true, redraw the tree-finder-grid element on window resize events
     */
    doWindowReize?: boolean;

    /**
     * select from different strategies for rendcering the paths
     */
    pathRender?: "regular" | "relative" | "tree";

    /**
     * if not null, the rendering of paths will change when any filter is set
     */
    pathRenderOnFilter?: "regular" | "relative" | "tree";

    /**
     * if true, add filter inputs to top of each colum
     */
     showFilter?: boolean;
  }
}

customElements.define("tree-finder-grid", TreeFinderGridElement);
