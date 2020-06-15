/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the regular-tree library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */

import "regular-table";
import {RegularTableElement} from "regular-table";

await customElements.whenDefined('regular-table');
const RegularTable = customElements.get('regular-table') as typeof RegularTableElement;

export class RegularTree extends RegularTable {
    constructor() {
        super();
    }
}

customElements.define('regular-tree', RegularTree);
