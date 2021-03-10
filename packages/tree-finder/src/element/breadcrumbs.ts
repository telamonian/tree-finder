/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "../content";
import { ContentsModel } from "../model";
import { Tag, Tree } from "../util";

import "../../style/breadcrumbs";

export class TreeFinderBreadcrumbsElement<T extends IContentRow> extends HTMLElement {
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

  init(model: ContentsModel<T>) {
    this.model = model;

    this.model.crumbs.crumbNamesSub.subscribe({
      next: x => this._onCrumbUpdate(x),
    });
  }

  protected async _onCrumbUpdate(path: string[]) {
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

    const target = event.target as HTMLElement;

    if (target.dataset.crumbix) {
      this.model.crumbs.revert(parseInt(target.dataset.crumbix));
    }
  }

  protected model: ContentsModel<T>;
  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
  private _initializedListeners: boolean = false;
}

// export namespace TreeFinderBreadcrumbsElement {
// }

customElements.define("tree-finder-breadcrumbs", TreeFinderBreadcrumbsElement);
