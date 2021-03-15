/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "../content";
import { ContentsModel } from "../model";
import { Tag } from "../util";

import { TreeFinderBreadcrumbsElement } from "./breadcrumbs";
import { TreeFinderFiltersElement } from "./filters";
import { TreeFinderGridElement } from "./grid";

export class TreeFinderPanelElement<T extends IContentRow> extends HTMLElement {
  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();
      this._initialized = true;
    }
  }

  clear() {
    this.innerHTML = Tag.html`
      <tree-finder-breadcrumbs class="tf-panel-breadcrumbs" slot="breadcrumbs"></tree-finder-breadcrumbs>
      ${this.options.showFilter ? `<tree-finder-filters class="tf-panel-filters" slot="filters"></tree-finder-filters>` : `<div slot="filters"></div>`}
      <tree-finder-grid class="tf-panel-grid" slot="grid"></tree-finder-grid>
    `;

    [this.breadcrumbs, this.filters, this.grid] = this.children as any as [TreeFinderBreadcrumbsElement<T>, TreeFinderFiltersElement<T>, TreeFinderGridElement<T>];
  }

  async init({root, options = {}, modelOptions = {}, gridOptions = {}}: {root: T, options?: TreeFinderPanelElement.IOptions<T>, modelOptions?: ContentsModel.IOptions<T>, gridOptions?: TreeFinderGridElement.IOptions<T>}) {
    this.options = options;

    this.clear();

    if (this._options.showFilter) {
      modelOptions.needsWidths = true;
    }
    this.model = new ContentsModel(root, modelOptions);

    this.breadcrumbs.init(this.model);
    if (this.options.showFilter) {
      this.filters.init(this.model);
    }
    this.grid.init(this.model, gridOptions);

    this.model.columnWidthsSub.subscribe(widths => {
      if (!widths.length) {
        return;
      }

      this.filters.getChild(0).style.marginLeft = '12px';
      for (const [ix, width] of widths.entries()) {
        const input = this.filters.getInput(ix);
        if (input) {
          input.style.width = width;
        }
      }
    });

    await this.draw();
  }

  async draw() {
    await this.grid.draw();
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const breadcrumbsSlot = `<slot name="breadcrumbs"></slot>`;
    const filterSlot = `<slot name="filters"></slot>`;
    const gridSlot = `<slot name="grid"></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
        :host {
          display: flex;
          flex-flow: column;
        }
        :host > div {
          position: relative;
        }
        :host > .tf-panel-filters-container {
          display: inline-block;
        }
        :host > .tf-panel-grid-container {
          flex: 1;
        }
      </style>
      <div class="tf-panel-breadcrumbs-container">
        ${breadcrumbsSlot}
      </div>
      <div class="tf-panel-filters-container">
        ${filterSlot}
      </div>
      <div class="tf-panel-grid-container">
        ${gridSlot}
      </div>
    `;

    [this.shadowSheet, this.breadcrumbsContainer, this.filterContainer, this.gridContainer] = this.shadowRoot!.children as any as [StyleSheet, HTMLElement, HTMLElement, HTMLElement];
  }

  get options() {
    return {...this._options};
  }

  set options(options: TreeFinderPanelElement.IOptions<T>) {
    const {
      showFilter = false,
    } = options;
    this._options = {
      showFilter
    }
  }

  protected shadowSheet: StyleSheet;
  protected breadcrumbsContainer: HTMLElement;
  protected filterContainer: HTMLElement;
  protected gridContainer: HTMLElement;

  protected breadcrumbs: TreeFinderBreadcrumbsElement<T>;
  protected filters: TreeFinderFiltersElement<T>;
  protected grid: TreeFinderGridElement<T>;

  protected _options: TreeFinderPanelElement.IOptions<T>;
  protected model: ContentsModel<T>;

  private _initialized: boolean = false;
}

export namespace TreeFinderPanelElement {
  export interface IOptions<T extends IContentRow> {
    /**
     * if true, add filter inputs in a separate widget above the tree-finder-grid
     */
     showFilter?: boolean;
  }
}

customElements.define("tree-finder-panel", TreeFinderPanelElement);
