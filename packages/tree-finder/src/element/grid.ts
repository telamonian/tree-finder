/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import * as rt from "regular-table";

import { Content, IContentRow } from "../content";
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
    // TODO: fix the godawful typing of .setDataListener on the regular-table side
    (this as any).setDataListener(this.dataListener.bind(this), {virtual_mode: this._options.virtual_mode});

    // run listener initializations only once
    if (!this._initializedListeners) {
      const [thead, tbody] = [(this as any).table_model.header.table, (this as any).table_model.body.table] as HTMLTableSectionElement[];

      this.addStyleListener(() => this.columnHeaderStyleListener())
      this.addStyleListener(() => this.rowStyleListener());

      this.addEventListener("mouseover", event => this.onMouseover(event));

      thead.addEventListener("mouseup", event => this.onSortClick(event));

      // handle selection by triggering onRowClick on both left and contextmenu (ie right) button click
      tbody.addEventListener("contextmenu", event => this.onRowClick(event));
      tbody.addEventListener("dblclick", event => this.onRowDoubleClick(event));
      tbody.addEventListener("mouseup", event => this.onRowClick(event));
      tbody.addEventListener("mouseup", event => this.onTreeClick(event));
      // this.addEventListener("scroll", () => (this as any)._resetAutoSize());

      // click debug listener
      // this.addEventListener("mousedown", event => RegularTable.clickLoggingListener(event, this));

      if (this.options.doWindowResize) {
        // resize whenever window size changes, if requested
        window.addEventListener('resize', async () => {
          await this.draw();
        });
      }

      // effectively a listener for model.requestDraw invocations
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

      this._initializedListeners = true;
    }

    this.model.requestDraw();
  }

  async dataListener(start_col: number, start_row: number, end_col: number, end_row: number) {
    return {
      // num_columns/rows: number -> count of cols/rows
      num_columns: this.model.columns.length,
      num_rows: this.model.contents.length,

      // column/row_headers: string[] -> arrays of path parts that get displayed as the first value in each col/row. Length > 1 implies a tree structure
      column_headers: this.model.columns.slice(start_col, end_col).map((x, i) => this.options.showFilter ? [this.filters!.getChild(i + 1), ...Tree.colHeaderSpans(x as string)] : Tree.colHeaderSpans(x as string)),
      row_headers: this.model.contents.slice(start_row, end_row).map(x => this._getRowHeader(x)),

      // data: object[][] -> array of arrays, each subarray containing all of the visible values for one column
      data: this.model.isBlank ? this._getData(start_col, start_row, end_col, end_row) : this._getDataFormatted(start_col, start_row, end_col, end_row),
    };
  }

  columnHeaderStyleListener() {
    this.cornerHeaderStyleListener();

    for (const th of (this.querySelectorAll("thead tr:first-child th") as any as HTMLTableHeaderCellElement[])) {
      th.classList.toggle("tf-header-align-left", true);

      const filter = th.querySelector("tree-finder-filter") as TreeFinderFilterElement<T>;
      if (filter) {
        filter.input.classList.toggle("tf-header-input", true);
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
    const newSpans = this.options.showFilter ? [this.filters!.getChild(0), ...Tree.colHeaderSpans("path")] : Tree.colHeaderSpans("path");
    for (let i = 0; i < initSpans.length; i++) {
      initSpans[i].replaceWith(newSpans[i]);
    }
  }

  rowStyleListener() {
    const spans = this.querySelectorAll("tbody th span.rt-group-name") as any as HTMLSpanElement[];
    for (const span of spans) {
      const {y} = RegularTable.metadataFromElement(span as HTMLTableCellElement, this)!;

      if (y != null) {
        const content = this.model.contents[y];

        // style the filetype icon for this row
        span.classList.add("tf-grid-filetype-icon", `tf-grid-${content.row.kind}-icon`);

        // style the path renamer for this row, if neded
        this._renamerStyleListener(span, content);
      }
    }

    this.rowSelectStyleListener();
  }

  rowSelectStyleListener() {
    const colCount = this.model.columns.length + 1;
    for (let tr of (this as any).table_model.body.rows as HTMLElement[]) {
      const {y} = RegularTable.metadataFromElement(tr.children[0]!, this)!;

      if (tr && tr.tagName === "TR") {
        tr.classList.toggle("tf-mod-select", this.model.selectionModel.has(this.model.contents[y!]));

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
    // allow both left and right click to fire this handler
    if (event.button !== 0 && event.button !== 2) {
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

    if (event.button === 2 && this.model.selectionModel.has(content)) {
      // if right-clicking on an existing selection, don't change it
      return;
    }

    if (event.shiftKey) {
      this.model.selectionModel.selectRange(content, this.model.contents);
    } else {
      this.model.selectionModel.select(content, event.ctrlKey || event.metaKey);
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
    if (element.classList.contains("rt-column-resize")) {
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
    await this.model.open(newRootContent.row);
  }

  get options() {
    return {...this._options};
  }

  set options({
    columnFormatters = undefined,
    doWindowResize = false,
    pathRender = "tree",
    pathRenderOnFilter = "relative",
    showFilter = false,
    virtual_mode = "vertical",
  }: TreeFinderGridElement.IOptions<T>) {
    this._options = {
      columnFormatters,
      doWindowResize,
      pathRender,
      pathRenderOnFilter,
      showFilter,
      virtual_mode,
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

  protected _getData(start_col: number, start_row: number, end_col: number, end_row: number) {
    const data: T[keyof T][][] = [];
    for (const column of this.model.columns.slice(start_col, end_col)) {
      data.push(
        this.model.contents.slice(start_row, end_row).map(content => content.row[column])
      );
    }

    return data;
  }

  protected _getDataFormatted(start_col: number, start_row: number, end_col: number, end_row: number) {
    const data: T[keyof T][][] = [];
    for (const column of this.model.columns.slice(start_col, end_col)) {
      const formatter = this.options?.columnFormatters?.[column] ?? (x => x);
      data.push(
        this.model.contents.slice(start_row, end_row).map(content => {
          const val = formatter(content.row[column]);
          return (val instanceof Date ? Format.DATE_FORMATTER.format(val) : val) as T[keyof T];
        })
      );
    }

    return data;
  }

  protected _getRowHeader(target: Content<T>) {
    return Tree.rowHeaderSpan({
      isDir: target.isDir,
      isExpand: target.isExpand,
      path: target.getPathAtDepth(this.model.pathDepth),
      editable: this.model.renamerTest(target),
      pathRender: this._pathRender,
    });
  }

  protected _renamerStyleListener(element: HTMLElement, target: Content<T>) {
    // if this path span is a renamer element, initialize it
    if (element.classList.contains("tf-mod-editable")) {
      if (!element.getAttribute("contenteditable")) {
        // activate renamer on enter, cancel it on escape
        element.addEventListener("keydown", (event: KeyboardEvent) => {
          if (event.key === "Enter") {
            element.blur();
          } else if (event.key === "Escape") {
            element.textContent = target.name;
            element.blur();
          }
        });
        // activate then destroy renamer when it loses focus
        element.addEventListener("blur", () => {
          const name = element.textContent;
          if (name) {
            // if name is blank, skip. Otherwise, perform the actual renaming
            target.row.path = [...target.row.path.slice(0, -1), name];
            element.classList.toggle("tf-mod-editable", false);
            element.removeAttribute("contenteditable");
            // publish renamer info when the editable element loses focus
            this.model.renamerSub.next({name, target: target});
          }
          // in any case, reset the renamer
          this.model.renamerPath = null;
        });
        element.setAttribute("contenteditable", "true");
      }
      // ensure that the renamer has focus so long as it exists and is visible
      element.focus();
    }
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
    doWindowResize?: boolean;

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

     /**
      * pass through to .setDataListener "virtual_mode" opt
      */
     virtual_mode?: "both" | "horizontal" | "none" | "vertical";
  }
}

customElements.define("tree-finder-grid", TreeFinderGridElement);
