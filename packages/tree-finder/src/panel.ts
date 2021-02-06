/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { IContentRow } from "./content";
import { ContentsModel } from "./model";
import { TreeFinderGridElement } from "./grid";

// const panelCSS = require("../style/index.css");

import * as panelCSS from "../style/index.css";

export class TreeFinderPanelElement<T extends IContentRow> extends HTMLElement {
  async init(root: T, options: Partial<TreeFinderPanelElement.IOptions<T>> = {}) {
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
    // const slot = `<slot></slot>`;
    this.shadowRoot!.innerHTML = `
      <style>
        ${panelCSS}
      </style>
      <div class="tf-panel-breadcrumbs">
      </div>
      <div class="tf-panel-filter">
      </div>
      <tree-finder-grid class="tf-panel-grid">
      </tree-finder-grid>
    `;

    [, this.breadcrumbs, this.filter, this.grid] = this.shadowRoot!.children as any as [HTMLStyleElement, HTMLElement, HTMLElement, TreeFinderGridElement<T>];
  }

  protected breadcrumbs: HTMLElement;
  protected filter: HTMLElement;
  protected grid: TreeFinderGridElement<T>;

  protected options: TreeFinderPanelElement.IOptions<T>;
  protected model: ContentsModel<T>;
}

export namespace TreeFinderPanelElement {
  export interface IOptions<T extends IContentRow> extends ContentsModel.IOptions<T>, TreeFinderGridElement.IOptions<T> {}
}
