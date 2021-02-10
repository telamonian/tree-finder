/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import "regular-table";

import { IContentRow } from "./content";
import { TreeFinderBreadcrumbsElement } from "./breadcrumbs";
import { TreeFinderGridElement } from "./grid";
import { TreeFinderPanelElement } from "./panel";

import "../style/grid/index.less";
import "../style/breadcrumbs.less";

declare global {
  interface Document {
    createElement<T extends IContentRow>(tagName: "tree-finder", options?: ElementCreationOptions): TreeFinderPanelElement<T>;
    createElement(tagName: "tree-finder-breadcrumbs", options?: ElementCreationOptions): TreeFinderBreadcrumbsElement;
    createElement<T extends IContentRow>(tagName: "tree-finder-grid", options?: ElementCreationOptions): TreeFinderGridElement<T>;
  }

  interface CustomElementRegistry {
    get(name: "tree-finder"): typeof TreeFinderPanelElement;
    get(name: "tree-finder-breadcrumbs"): typeof TreeFinderBreadcrumbsElement;
    get(name: "tree-finder-grid"): typeof TreeFinderGridElement;
  }
}

customElements.define("tree-finder", TreeFinderPanelElement);
customElements.define("tree-finder-breadcrumbs", TreeFinderBreadcrumbsElement);
customElements.define("tree-finder-grid", TreeFinderGridElement);

export * from "./content";
export * from "./panel";
export * from "./mockcontent";
export * from "./model";
export * from "./sort";
export * from "./grid";
export * from "./util";
