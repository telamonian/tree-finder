/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Content, IContentRow } from "../content";
import { RenamerModel } from "../model";
import { Path, Tag } from "../util";

export class TreeFinderRenamerElement<T extends IContentRow> extends HTMLElement {
  clear() {
    this.innerHTML = `<input autofocus class="tf-renamer-input"></input>`;

    [this._input] = this.children as any as [HTMLInputElement];
    this.input.value = this.model.name;
  }

  connectedCallback() {
    if (!this._initialized) {
      this.create_shadow_dom();

      this._initialized = true;
    }

    if (!this._initializedListeners) {
      this.addEventListener("blur", (event: FocusEvent) => this.onBlur());
      this.addEventListener("input", (event: InputEvent) => this.onInput(event));
      this.addEventListener("keydown", (event: KeyboardEvent) => {if (event.key === "enter") {this.onBlur();}});

      this._initializedListeners = true;
    }
  }

  init(target: Content<T>, renamerFunc: (target: Content<T>, name: Path.PathArray) => Promise<void>) {
    this.model = new RenamerModel(target, renamerFunc);

    this.clear();
  }

  create_shadow_dom() {
    this.attachShadow({mode: "open"});

    const inputSlot = `<slot></slot>`;

    this.shadowRoot!.innerHTML = Tag.html`
      <style>
        :host > .tf-renamer-top {
          display: inline-block;
          padding: 8px 0px 4px 0px;
          width: 100%;
        }
      </style>
      <div class="tf-renamer-top">
        ${inputSlot}
      </div>
    `;

    [this.shadowSheet, this.top] = this.shadowRoot!.children as any as [StyleSheet, HTMLElement];
  }

  onBlur() {
    this.model.doRename();
  }

  onInput(event: InputEvent) {
    this.model.name = (event.target as HTMLInputElement).value;
  }

  get input() {
    return this._input;
  }

  protected _input: HTMLInputElement;

  protected model: RenamerModel<T>;
  protected shadowSheet: StyleSheet;
  protected top: HTMLElement;

  private _initialized: boolean = false;
  private _initializedListeners: boolean = false;
}

customElements.define("tree-finder-renamer", TreeFinderRenamerElement);
