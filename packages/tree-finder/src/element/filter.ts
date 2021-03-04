/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "../content";
import { ContentsModel } from "../model";
import { Tag } from "../util";

import "../../style/filter";

export class TreeFinderFilterElement<T extends IContentRow> extends HTMLElement {
  clear() {
    this.innerHTML = `<input class="tf-filter-input"></input>`;

    [this._input] = this.children as any as [HTMLInputElement];
  }

  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();

      this._initialized = true;
    }

    if (!this._initializedListeners) {
      this.addEventListener("input", event => this.onInput(event as InputEvent));

      this._initializedListeners = true;
    }
  }

  init(model: ContentsModel<T>, ix: number = 0) {
    this.model = model;

    this.clear();

    if (ix === 0) {
      this.col = "path";
    } else {
      this.col = this.model.columns[ix - 1];
    }
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

  onInput(event: InputEvent) {
    const fpat = {col: this.col, pattern: (event.target as HTMLInputElement).value};
    this.model.onFilterInput(fpat);
  }

  get input() {
    return this._input;
  }

  protected _input: HTMLInputElement;

  protected col: keyof T;
  protected model: ContentsModel<T>;
  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
  private _initializedListeners: boolean = false;
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
