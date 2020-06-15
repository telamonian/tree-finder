/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the regular-tree library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */

import "regular-table";

await customElements.whenDefined('regular-table');
const RegularTableElement = customElements.get('regular-table');

export class RegularTreeElement extends RegularTableElement {
  constructor() {
    super();
  }
}

declare global {
  interface Document {
    createElement(tagName: "regular-tree", options?: ElementCreationOptions): RegularTreeElement;
  }

  interface CustomElementRegistry {
    get(name: 'regular-tree'): typeof RegularTreeElement;
  }
}

customElements.define('regular-tree', RegularTreeElement);
