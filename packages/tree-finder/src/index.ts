/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { IContentRow } from "./content";
import {
  TreeFinderBreadcrumbsElement,
  TreeFinderFilterElement,
  TreeFinderGridElement,
  TreeFinderPanelElement,
} from "./element";

declare global {
  interface Document {
    createElement<T extends IContentRow>(tagName: "tree-finder", options?: ElementCreationOptions): TreeFinderPanelElement<T>;
    createElement(tagName: "tree-finder-breadcrumbs", options?: ElementCreationOptions): TreeFinderBreadcrumbsElement;
    createElement(tagName: "tree-finder-filter", options?: ElementCreationOptions): TreeFinderFilterElement;
    createElement<T extends IContentRow>(tagName: "tree-finder-grid", options?: ElementCreationOptions): TreeFinderGridElement<T>;
  }

  interface CustomElementRegistry {
    get(name: "tree-finder"): typeof TreeFinderPanelElement;
    get(name: "tree-finder-breadcrumbs"): typeof TreeFinderBreadcrumbsElement;
    get(name: "tree-finder-filter"): typeof TreeFinderFilterElement;
    get(name: "tree-finder-grid"): typeof TreeFinderGridElement;
  }
}

export * from "./content";
export * from "./element";
export * from "./filtersort";
export * from "./model";
export * from "./util";
