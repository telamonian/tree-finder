import { IContent, IContentRow, Path } from "./content";

const SORT_ORDERS = ["asc", "desc", null] as const;
type SortOrder = typeof SORT_ORDERS[number];

interface ISortState<T extends IContentRow> {
    col: keyof T;

    order: SortOrder;
}
type ISortStates<T extends IContentRow> = ISortState<T>[];

function contentsSorterClosure<T extends IContentRow>(sortStates: ISortStates<T>) {
    // map sort direction string onto sort direction sign
    const signs = sortStates.map(({col, order}) => {return {col, sign: (order === "desc" ? -1 : 1)}});

    return function contentsSorter(l: IContent<T>, r: IContent<T>): number {
        for (const {col, sign} of signs) {
            let cmp;
            let lval = l.row[col];
            let rval = r.row[col];

            // the "paths" field will be an array of the parts of the path, just compare the last part
            // if (Array.isArray(lval)) {
            //     lval = lval[lval.length - 1];
            //     rval = rval[rval.length - 1];
            // }

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

function updateSort<T extends IContentRow>(sortStates: ISortStates<T>, col: keyof T, multisort: boolean = false): ISortStates<T> {
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
        const newSortState = {col, order: SORT_ORDERS[0]};
        if (multisort) {
            sortStates.push(newSortState);
        } else {
            sortStates = [newSortState];
        }
    }

    return sortStates;
}

function _flattenContents<T extends IContentRow>(contents: IContent<T>, sorter: (l: IContent<T>, r: IContent<T>) => number, contents_list: IContent<T>[]) {
    if (!contents) {
        // bail
        return contents_list;
    }

    for (const child of sorter ? contents.children.sort(sorter) : contents.children) {
        contents_list.push(child);
        if (child._is_open) {
            _flattenContents(child, sorter, contents_list);
        }
    }

    return contents_list;
}

export function getSortedContents<T extends IContentRow>(root: Path, sortStates: ISortStates<T>, col: keyof T, expand?: boolean, multisort?: boolean) {
    // update sort orders, if requested
    if (col) {
        sortStates = updateSort(sortStates, col, multisort);

        // if sortStates is empty, use a default sortState
        sortStates = sortStates.length > 0 ? sortStates : [{col: "path", order: "asc"}];
    }

    const sorter = contentsSorterClosure(sortStates);

    // get contents, then sort/flatten and return them
    const contents = window.getFileSystemContents(root, expand);
    return [_flattenContents(contents, sorter, []), sortStates];
}
