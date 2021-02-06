/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "./content";
import { ContentsModel } from "./model";
import { TreeFinderGridElement } from "./grid";
import { Tag } from "./util";

import panelCSS from "../style/grid/index.less";

export class TreeFinderPanelElement<T extends IContentRow> extends HTMLElement {
  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();
      this._initialized = true;
    }
  }

  clear() {
    this.innerHTML = Tag.html`
      <div className="tf-panel-breadcrumbs" slot="breadcrumbs"></div>
      <div className="tf-panel-filter" slot="filter"></div>
      <tree-finder-grid className="tf-panel-grid" slot="grid"></tree-finder-grid>
    `;

    [this.breadcrumbs, this.filter, this.grid] = this.children as any as [HTMLElement, HTMLElement, TreeFinderGridElement<T>];
  }

  async init(root: T, options: Partial<TreeFinderPanelElement.IOptions<T>> = {}) {
    this.clear();

    const gridOptions: Partial<TreeFinderGridElement.IOptions<T>> = {
      doWindowReize: options.doWindowReize,
    }

    const modelOptions: Partial<ContentsModel.IOptions<T>> = {
      columnNames: options.columnNames,
      doRefetch: options.doRefetch,
    }

    this.model = new ContentsModel(root, modelOptions);
    this.grid.init(this.model, gridOptions);

    await this.draw();
  }

  async draw() {
    await (this.grid as any).draw();
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const breadcrumbsSlot = `<slot name="breadcrumbs"></slot>`;
    const filterSlot = `<slot name="filter"></slot>`;
    const gridSlot = `<slot name="grid"></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
        ${panelCSS}
      </style>
      <div class="tf-panel-breadcrumbs-container">
        ${breadcrumbsSlot}
      </div>
      <div class="tf-panel-filter-container">
        ${filterSlot}
      </div>
      <div class="tf-panel-grid-container">
        ${gridSlot}
      </div>
    `;

    [, this.breadcrumbsContainer, this.filterContainer, this.gridContainer] = this.shadowRoot!.children as any as [void, HTMLElement, HTMLElement, HTMLElement];
  }

  protected breadcrumbsContainer: HTMLElement;
  protected filterContainer: HTMLElement;
  protected gridContainer: HTMLElement;

  protected breadcrumbs: HTMLElement;
  protected filter: HTMLElement;
  protected grid: TreeFinderGridElement<T>;

  protected options: TreeFinderPanelElement.IOptions<T>;
  protected model: ContentsModel<T>;

  private _initialized: boolean = false;
}

export namespace TreeFinderPanelElement {
  export interface IOptions<T extends IContentRow> extends ContentsModel.IOptions<T>, TreeFinderGridElement.IOptions<T> {}
}
