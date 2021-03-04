/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { ContentsModel } from "../model";
import { Tag } from "../util";

import "../../style/filter";

export class TreeFinderFilterElement extends HTMLElement {
  clear() {
    this.innerHTML = `<input class="tf-filter-input"></input>`;

    [this.input] = this.children as any as [HTMLInputElement];
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

  init(model: ContentsModel<any>) {
    this.model = model;

    this.clear();
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const inputSlot = `<slot></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
        :host > .tf-filter-top {
          display: inline-block;
          padding: 8px 0px 4px 0px;
        }
      </style>
      <div class="tf-filter-top">
        ${inputSlot}
      </div>
    `;

    [this.shadowSheet, this.top] = this.shadowRoot!.children as any as [StyleSheet, HTMLElement];
  }


  protected model: ContentsModel<any>;
  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;
  protected input: HTMLInputElement;

  private _initialized: boolean = false;
  // private _initializedListeners: boolean = false;
}

export namespace TreeFinderFilterElement {
  export function get() {
    if (document.createElement("tree-finder-filter").constructor === HTMLElement) {
      customElements.define("tree-finder-filter", TreeFinderFilterElement);
    }

    return customElements.get('tree-finder-filter');
  }
}

TreeFinderFilterElement.get();
