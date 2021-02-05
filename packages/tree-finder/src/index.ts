/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import "regular-table";

import { IContentRow } from "./content";
import { TreeFinderElement } from "./treefinder";

import "../style/index.css";

declare global {
  interface Document {
    createElement<T extends IContentRow>(tagName: "tree-finder", options?: ElementCreationOptions): TreeFinderElement<T>;
  }

  interface CustomElementRegistry {
    get(name: 'tree-finder'): typeof TreeFinderElement;
  }
}

customElements.define('tree-finder', TreeFinderElement);

export * from "./content";
export * from "./mockcontent";
export * from "./sort";
export * from "./treefinder";
export * from "./util";
