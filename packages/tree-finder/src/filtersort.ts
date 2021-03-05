/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Content, DEFAULT_COL, IContentRow } from "./content";

const SORT_ORDERS = ["asc", "desc", null] as const;
export type SortOrder = typeof SORT_ORDERS[number];

const DEFAULT_SORT_ORDER = SORT_ORDERS[0];

interface IFilterPattern<T extends IContentRow> {
  col: keyof T;

  pattern: string;
}

export class FilterPatterns<T extends IContentRow> {
  constructor(patterns?: IFilterPattern<T>[]) {
    if (!patterns) {
      return;
    }

    for (const fpat of patterns) {
      this.set(fpat);
    }
  }

  set(fpat: IFilterPattern<T>) {
    const {col, pattern} = fpat;

    if (!pattern) {
      delete this._patterns[col];
    } else {
      this._patterns[col] = pattern;
    }
  }

  get any(): boolean {
    return !!Object.keys(this.patterns).length;
  }

  get patterns() {
    return this._patterns;
  }

  protected _patterns: {[k in keyof T]: string} = {} as any;
}

interface ISortState<T extends IContentRow> {
  col: keyof T;

  order: SortOrder;
}

interface ISortStateFull<T extends IContentRow> extends ISortState<T> {
  sign: -1 | 1;

  ix: number;
}

export class SortStates<T extends IContentRow> {
  readonly defaultColumn = DEFAULT_COL;

  constructor(states?: ISortState<T>[]) {
    states = states ?? [{col: DEFAULT_COL, order: DEFAULT_SORT_ORDER}];

    this.states = states.map((state, ix) => {return {
      ...state,
      ix,
      sign: state.order === "desc" ? -1 : 1,
    }});

    this.byColumn = this.states.reduce((obj, state) => {obj[state.col] = state; return obj;}, {} as any);
  }

  readonly byColumn: {[k in keyof T]: ISortStateFull<T>};
  readonly states: ISortStateFull<T>[];
}

function contentsFiltererClosure<T extends IContentRow>(filterPatterns: FilterPatterns<T>, pathDepth: number = 0) {
  return function contentsFilterer(content: Content<T>): boolean {
    for (const key of Object.keys(filterPatterns.patterns)) {
      if (key === "path") {
        if (!content.getPathAtDepth(pathDepth).join("/").includes(filterPatterns.patterns[key])) {
          return false;
        }
      } else {
        if (!(content.row[key as keyof T] as any as string).includes(filterPatterns.patterns[key as keyof T])) {
          return false;
        }
      }
    }
    return true;
  };
}

function contentsSorterClosure<T extends IContentRow>(sortStates: SortStates<T>) {
  return function contentsSorter(l: Content<T>, r: Content<T>): number {
    for (const {col, sign} of sortStates.states) {
      let cmp;
      let lval = l.row[col];
      let rval = r.row[col];

      // the "paths" field will be an array of the parts of the path, just compare the last part
      if (Array.isArray(lval)) {
        lval = lval[lval.length - 1];
        rval = (rval as any)[(rval as any).length - 1];
      }

      if (typeof lval === "string") {
        cmp = lval.localeCompare(rval as any as string);
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

function updateSort<T extends IContentRow>(sortStates: SortStates<T>, col: keyof T, multisort: boolean = false): SortStates<T> {
  let newStates: ISortState<T>[] = [...sortStates.states];

  if (col in sortStates.byColumn) {
    const {ix: currentIdx, order: oldOrder} = sortStates.byColumn[col];

    const order = SORT_ORDERS[(SORT_ORDERS.indexOf(oldOrder) + 1) % SORT_ORDERS.length];
    if (order) {
      // update the sort_dir
      newStates[currentIdx] = {col, order};
    } else {
      // remove this column from the sort
      newStates.splice(currentIdx, 1);
    }
  } else {
    const newState = {col, order: DEFAULT_SORT_ORDER};
    if (multisort) {
      newStates.push(newState);
    } else {
      newStates = [newState];
    }
  }

  return new SortStates(newStates);
}

async function _flattenContents<T extends IContentRow>(content: Content<T>, filterer?: (c: Content<T>) => boolean, sorter?: (l: Content<T>, r: Content<T>) => number, contentsFlat: Content<T>[] = []) {
  if (content.cache) {
    let children;
    if (sorter) {
      children = content.cache.sort(sorter);
    } else {
      children = content.cache;
    }

    for (const child of children) {
      contentsFlat.push(child);
      if (child.isExpand) {
        await _flattenContents(child, filterer, sorter, contentsFlat);
      }
    }
  }

  if (filterer) {
    return contentsFlat.filter(filterer);
  } else {
    return contentsFlat;
  }
}

export async function filterContentRoot<T extends IContentRow>({root, filterPatterns, pathDepth}: {root: Content<T>, filterPatterns: FilterPatterns<T>, pathDepth?: number}): Promise<Content<T>[]> {
  // get sorter then sort/flatten any expanded children of root
  return await _flattenContents(root, contentsFiltererClosure(filterPatterns, pathDepth ?? root.row.path.length), undefined, []);
}

export async function filterSortContentRoot<T extends IContentRow>({root, filterPatterns, sortStates, col, multisort, pathDepth}: {root: Content<T>, filterPatterns: FilterPatterns<T>, sortStates: SortStates<T>, col?: keyof T, multisort?: boolean, pathDepth?: number}): Promise<[Content<T>[], SortStates<T>]> {
  // update sort orders, if requested
  if (col) {
    sortStates = updateSort(sortStates, col, multisort);

    if (!sortStates.states.length) {
      // if empty, use default sortStates
      sortStates = new SortStates();
    }
  }

  // get sorter then sort/flatten any expanded children of root
  return [await _flattenContents(root, contentsFiltererClosure(filterPatterns, pathDepth ?? root.row.path.length), contentsSorterClosure(sortStates), []), sortStates];
}

export async function sortContentRoot<T extends IContentRow>({root, sortStates, col, multisort}: {root: Content<T>, sortStates: SortStates<T>, col?: keyof T, multisort?: boolean}): Promise<[Content<T>[], SortStates<T>]> {
  // update sort orders, if requested
  if (col) {
    sortStates = updateSort(sortStates, col, multisort);

    if (!sortStates.states.length) {
      // if empty, use default sortStates
      sortStates = new SortStates();
    }
  }

  // get sorter then sort/flatten any expanded children of root
  return [await _flattenContents(root, undefined, contentsSorterClosure(sortStates), []), sortStates];
}
