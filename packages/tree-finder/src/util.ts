/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { MetaData, RegularTableElement } from "regular-table";

export namespace Random {
  export function bool() {
    return Math.random() < 0.5;
  }

  // randomize array in-place using Durstenfeld shuffle algorithm
  // ref: https://stackoverflow.com/a/12646864
  export function shuffle<T>(arr: T[], inPlace: boolean = false) {
    arr = inPlace ? arr : [...arr];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}

export namespace RegularTable {
  /*
   * click-related functions
   */

  export function cellClicked(metadata: MetaData): boolean {
    return typeof metadata?.y !== "undefined" && !metadata?.column_header_y;
  }

  export function columnHeaderClicked(metadata: MetaData): boolean {
    return typeof (metadata as any)?.row_header_y !== "undefined" && !!metadata?.column_header;
  }

  export function rowClicked(metadata: MetaData): boolean {
    return cellClicked(metadata) || rowHeaderClicked(metadata);
  }

  export function rowHeaderClicked(metadata: MetaData): boolean {
    return typeof (metadata as any)?.row_header_x !== "undefined" && !!metadata?.row_header;
  }

  /*
   * debug utils
   */

  export function clickLoggingListener(event: MouseEvent, rt: RegularTableElement) {
    const metadata = metadataFromEvent(event, rt);

    if (cellClicked(metadata)) {
      console.log(`cell clicked`);
    }
    if (columnHeaderClicked(metadata)) {
      console.log(`column header clicked`);
    }
    if (rowClicked(metadata)) {
      console.log(`row clicked`);
    }
    if (rowHeaderClicked(metadata)) {
      console.log(`row header clicked`);
    }
  }

  /*
   * general metadata-related functions
   */

  export function metadataFromEvent(event: Event, rt: RegularTableElement) {
    return rt.getMeta(event.target as HTMLTableCellElement);
  }
}
