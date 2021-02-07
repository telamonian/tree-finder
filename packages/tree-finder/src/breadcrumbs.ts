/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Tag, Tree } from "./util";

export class TreeFinderBreadcrumbsElement extends HTMLElement {
  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();
      this._initialized = true;
    }
  }

  async init(path: string[]) {
    this.innerHTML = Tree.breadcrumbsSpans(path);
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const crumbsSlot = `<slot"></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
      </style>
      <div class="tf-breadcrumbs-top">
        ${crumbsSlot}
      </div>
    `;

    [this.shadowSheet, this.top] = this.shadowRoot!.children as any as [StyleSheet,HTMLElement];
  }

  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
}
