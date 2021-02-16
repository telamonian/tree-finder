/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Tag, Tree } from "./util";

import "../style/breadcrumbs";

export class TreeFinderBreadcrumbsElement extends HTMLElement {
  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();

      this._initialized = true;
    }

    if (!this._initializedListeners) {
      this.addEventListener("mouseup", event => this.onClick(event));

      this._initializedListeners = true;
    }
  }

  async init(path: string[]) {
    this.innerHTML = Tree.breadcrumbsSpans(path);
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const crumbsSlot = `<slot></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
        .tf-breadcrumbs-top {
          display: flex;
          align-items: flex-start;
        }
      </style>
      <div class="tf-breadcrumbs-top">
        ${crumbsSlot}
      </div>
    `;

    [this.shadowSheet, this.top] = this.shadowRoot!.children as any as [StyleSheet,HTMLElement];
  }

  async onClick(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }

    console.log(event);
    console.log(event.target);
  }

  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
  private _initializedListeners: boolean = false;
}

export namespace TreeFinderBreadcrumbsElement {
  export function get() {
    if (document.createElement("tree-finder-breadcrumbs").constructor === HTMLElement) {
      customElements.define("tree-finder-breadcrumbs", TreeFinderBreadcrumbsElement);
    }

    return customElements.get('tree-finder-breadcrumbs');
  }
}

TreeFinderBreadcrumbsElement.get();
