/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */
import "regular-table";

import { IContent, IContentRow } from "./content";
import { sortContentRoot } from "./sort";

await customElements.whenDefined('regular-table');
const RegularTableElement = customElements.get('regular-table');

export class TreeFinderElement<T extends IContentRow> extends RegularTableElement {
  constructor(public root: IContent<T>) {
    super();

    this.setDataListener(() => this.model);
    this.addEventListener("mousedown", () => this.onSortClick);
    this.addEventListener("mousedown", () => this.onTreeClick);
    this.addStyleListener(() => this.styleModel);
  }

    // splice out the contents of the collapsed node and any expanded subnodes
    async collapse(rix: number) {
        const content = this.contents[rix];

        let npop = content.children?.length ?? 0;
        let check_ix = rix + 1 + npop;
        while (this.contents[check_ix++].row.path.length > content.row.path.length) {
            npop++;
        }
        this.contents.splice(rix + 1, npop);

        content.expanded = false;
    }

    async expand(rix: number) {
        const content = this.contents[rix];
        content.expanded = true;

        const contents = sortContentRoot(this.contents[rix], SORT, true);
        this.contents.splice(rix + 1, 0, ...contents_list);
    }

    tree_header_levels(path, expandContent, is_leaf) {
        const tree_levels = path.slice(1).map(() => '<span class="pd-tree-group"></span>');
        if (!is_leaf) {
            const group_icon = expandContent ? "remove" : "add";
            const tree_button = `<span class="pd-row-header-icon">${group_icon} </span>`;
            tree_levels.push(tree_button);
        }

        return tree_levels.join("");
    }

    tree_header({path, expandContent, kind}) {
        const name = path.length === 0 ? "TOTAL" : path[path.length - 1];
        const header_classes = kind === "text" ? "pd-group-name pd-group-leaf" : "pd-group-name";
        const tree_levels = tree_header_levels(path, expandContent, kind === "text");
        const header_text = name;
        TEMPLATE.innerHTML = `<span class="pd-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;
        return TEMPLATE.content.firstChild;
    }

    async model(start_col: number, start_row: number, end_col: number, end_row: number) {
        const data = [];
        for (let cix = start_col; cix < end_col; cix++) {
            const name = COLUMN_HEADERS[cix];
            data.push(
                this.contents.slice(start_row, end_row).map((c) => {
                    return name === "modified" ? DATE_FORMATTER.format(c[name]) : c[name];
                })
            );
        }

        return {
            num_rows: this.contents.length,
            num_columns: COLUMN_HEADERS.length,
            column_headers: COLUMN_HEADERS.map((col) => [col]),
            row_headers: this.contents.slice(start_row, end_row).map((x) => [tree_header(x)]),
            data,
        };
    }

    styleModel() {
        // style the column header sort carets
        const sort_obj = Object.fromEntries(SORT);
        // for (const th of this.get_ths()) {

        const ths = this.querySelectorAll("thead th");
        for (const th of ths) {
            const column_header = this.getMeta(th as HTMLTableCellElement)?.column_header?.[0];
            if (column_header) {
                const sort_dir = sort_obj[column_header === "0" ? "path" : column_header];
                th.className = sort_dir ? `rt-sort-${sort_dir}` : "";
            }
        }

        // style the browser's filetype icons
        const trs = this.querySelectorAll("tbody tr");
        for (const tr of trs) {
            const {children} = tr;
            const row_name_node = children[0].querySelector(".pd-group-name") as HTMLElement;
            for (let i = 1; i < children.length; i++) {
                const text = children[i].textContent;
                if (text === "dir") {
                    row_name_node.classList.add("rt-browser-filetype-icon", "rt-browser-dir-icon");
                    break;
                } else if (text === "text") {
                    row_name_node.classList.add("rt-browser-filetype-icon", "rt-browser-text-icon");
                    break;
                }
            }
        }
    }

    onSortClick() {
        const metadata = this.getMeta(event.target);

        if (metadata?.hasOwnProperty('column_header')) {
            const column_name = metadata.value || "path";
            const multi = event.shiftKey;

            [this.contents, SORT] = sortContentRoot(ROOT, SORT, false, column_name, multi);
            this.draw({invalid_viewport: true});
        }
    }

    onTreeClick(event: MouseEvent) {
        let target = event.target as HTMLElement;
        if (target.tagName === "SPAN" && target.className === "pd-row-header-icon") {
            let metadata = this.getMeta(target);
            while (!metadata && target.parentElement) {
                target = target.parentElement;
                metadata = this.getMeta(target);
            }

            if (this.contents[metadata.y].expanded) {
                collapse(metadata.y);
            } else {
                expand(metadata.y);
            }
            this.draw({invalid_viewport: true});
        }
    }

    contents: IContent<T>[] = [];
}

const COLUMN_HEADERS = ["modified", "kind", "writable"];
const DATE_FORMATTER = new Intl.DateTimeFormat("en-us");
let ROOT = [];
// const treeFinder = document.getElementsByTagName("tree-finder")[0];
const TEMPLATE = document.createElement("template");

// set initial sort while also creating the root contents
let [this.contents, SORT] = sortContentRoot(ROOT, [["path", "asc"]], true);

