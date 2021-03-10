/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "../content";
import { ContentsModel } from "../model";
import { Tag } from "../util";

import { TreeFinderFilterElement } from "./filter";

export class TreeFinderFiltersElement<T extends IContentRow> extends HTMLElement {
  clear() {
    this.innerHTML = `<tree-finder-filter></tree-finder-filter>`.repeat(this.model.columns.length + 1);

    this.filters = [...this.children] as TreeFinderFilterElement<T>[];
  }

  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();

      this._initialized = true;
    }

    // if (!this._initializedListeners) {
    //   this.addEventListener("mouseup", event => this.onClick(event));

    //   this._initializedListeners = true;
    // }
  }

  init(model: ContentsModel<T>) {
    if (!this._initialized) {
      this.create_shadow_dom();

      this._initialized = true;
    }

    this.model = model;

    this.clear();

    for (const [index, element] of this.filters.entries()) {
      element.init(model, index);
    }
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const filterSlot = `<slot></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
      </style>
      <div class="tf-filters-top">
        ${filterSlot}
      </div>
    `;

    [this.shadowSheet, this.top] = this.shadowRoot!.children as any as [StyleSheet, HTMLElement];
  }

  entries() {
    return this.filters.entries();
  }

  getChild(ix: number): TreeFinderFilterElement<T> {
    return this.filters[ix];
  }

  getInput(ix: number): HTMLInputElement {
    return this.getChild(ix)?.input;
  }

  protected filters: TreeFinderFilterElement<T>[];
  protected model: ContentsModel<T>;
  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
  // private _initializedListeners: boolean = false;
}

// export namespace TreeFinderFiltersElement {
// }

customElements.define("tree-finder-filters", TreeFinderFiltersElement);
