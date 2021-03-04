/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "./content";
import { TreeFinderBreadcrumbsElement } from "./breadcrumbs"
import { TreeFinderFilterElement } from "./filter";
import { ContentsModel } from "./model";
import { TreeFinderGridElement } from "./grid";
import { Tag } from "./util";

import "../style/panel";

TreeFinderBreadcrumbsElement.get();
TreeFinderFilterElement.get();
TreeFinderGridElement.get();

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
      <tree-finder-filter class="tf-panel-filter" slot="filter"></tree-finder-filter>
      <tree-finder-grid class="tf-panel-grid" slot="grid"></tree-finder-grid>
    `;

    [this.breadcrumbs, this.filter, this.grid] = this.children as any as [TreeFinderBreadcrumbsElement, TreeFinderFilterElement, TreeFinderGridElement<T>];
  }

  async init(root: T, options: Partial<TreeFinderPanelElement.IOptions<T> & ContentsModel.IOptions<T> & TreeFinderGridElement.IOptions<T>> = {}) {
    // const {
    //   openChildren = true,
    // } = options;
    // this.options = {
    //   openChildren,
    // }

    this.clear();

    const gridOptions: Partial<TreeFinderGridElement.IOptions<T>> = {
      doWindowReize: options.doWindowReize,
    }

    const modelOptions: Partial<ContentsModel.IOptions<T>> = {
      columnNames: options.columnNames,
      doRefetch: options.doRefetch,
    }

    this.model = new ContentsModel(root, modelOptions);

    this.breadcrumbs.init(this.model);
    this.filter.init(this.model);
    this.grid.init(this.model, gridOptions);

    await this.draw();
  }

  async draw() {
    await this.grid.draw();
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const breadcrumbsSlot = `<slot name="breadcrumbs"></slot>`;
    const filterSlot = `<slot name="filter"></slot>`;
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
        :host > .tf-panel-grid-container {
          flex: 1;
        }
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

    [this.shadowSheet, this.breadcrumbsContainer, this.filterContainer, this.gridContainer] = this.shadowRoot!.children as any as [StyleSheet, HTMLElement, HTMLElement, HTMLElement];
  }

  protected shadowSheet: StyleSheet;
  protected breadcrumbsContainer: HTMLElement;
  protected filterContainer: HTMLElement;
  protected gridContainer: HTMLElement;

  protected breadcrumbs: TreeFinderBreadcrumbsElement;
  protected filter: TreeFinderFilterElement;
  protected grid: TreeFinderGridElement<T>;

  protected options: TreeFinderPanelElement.IOptions<T>;
  protected model: ContentsModel<T>;

  private _initialized: boolean = false;
}

export namespace TreeFinderPanelElement {
  export interface IOptions<T extends IContentRow> {
    openChildren: boolean;
  }

  export function get() {
    if (document.createElement("tree-finder").constructor === HTMLElement) {
      customElements.define("tree-finder", TreeFinderPanelElement);
    }

    return customElements.get('tree-finder');
  }
}

TreeFinderPanelElement.get();
