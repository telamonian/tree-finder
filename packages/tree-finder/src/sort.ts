/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { DEFAULT_COL, Content, IContentRow } from "./content";

const SORT_ORDERS = ["asc", "desc", null] as const;
export type SortOrder = typeof SORT_ORDERS[number];

export const DEFAULT_SORT_ORDER = SORT_ORDERS[0];

export interface ISortState<T extends IContentRow> {
  col: keyof T;

  order: SortOrder;
}

function contentsSorterClosure<T extends IContentRow>(sortStates: ISortState<T>[]) {
  // map sort direction string onto sort direction sign
  const signs = sortStates.map(({col, order}) => {return {col, sign: (order === "desc" ? -1 : 1)}});

  return function contentsSorter(l: Content<T>, r: Content<T>): number {
    for (const {col, sign} of signs) {
      let cmp;
      let lval = l.row[col];
      let rval = r.row[col];

      // the "paths" field will be an array of the parts of the path, just compare the last part
      if (Array.isArray(lval)) {
        lval = lval[lval.length - 1];
        rval = (rval as any)[(rval as any).length - 1];
      }

      if (typeof lval === "string") {
        cmp = (lval as string).localeCompare(rval as any as string);
      } else {
        cmp = (lval as any as number) - (rval as any as number);
      }

      if (cmp) {
        return sign * cmp;
      }
    }
    return 0;
  };
}

function updateSort<T extends IContentRow>(sortStates: ISortState<T>[], col: keyof T, multisort: boolean = false): ISortState<T>[] {
  const currentIdx = sortStates.findIndex((x) => x.col === col);
  if (currentIdx > -1) {
    const oldOrder = sortStates[currentIdx].order;
    const order = SORT_ORDERS[(SORT_ORDERS.indexOf(oldOrder) + 1) % SORT_ORDERS.length];
    if (order) {
      // update the sort_dir
      sortStates[currentIdx] = {col, order};
    } else {
      // remove this column from the sort
      sortStates.splice(currentIdx, 1);
    }
  } else {
    const newSortState = {col, order: DEFAULT_SORT_ORDER};
    if (multisort) {
      sortStates.push(newSortState);
    } else {
      sortStates = [newSortState];
    }
  }

  return sortStates;
}

function _flattenContents<T extends IContentRow>(content: Content<T>, sorter: (l: Content<T>, r: Content<T>) => number, contentsFlat: Content<T>[]) {
  if (!content) {
    // bail
    return contentsFlat;
  }

  if (content.children) {
    for (const child of sorter ? content.children?.sort(sorter) : content.children) {
      contentsFlat.push(child);
      if (child.isOpen) {
        _flattenContents(child, sorter, contentsFlat);
      }
    }
  }

  return contentsFlat;
}

export function sortContentRoot<T extends IContentRow>({root, sortStates, col, multisort}: {root: Content<T>, sortStates: ISortState<T>[], col?: keyof T, multisort?: boolean}): [Content<T>[], ISortState<T>[]] {
  // update sort orders, if requested
  if (col) {
    sortStates = updateSort(sortStates, col, multisort);

    // if sortStates is empty, use a default sortState
    sortStates = sortStates.length > 0 ? sortStates : [{col: DEFAULT_COL, order: DEFAULT_SORT_ORDER}];
  }

  // get sorter then sort/flatten any expanded children of root
  return [_flattenContents(root, contentsSorterClosure(sortStates), []), sortStates];
}
