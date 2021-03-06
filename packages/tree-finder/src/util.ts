/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { MetaData, RegularTableElement } from "regular-table";

export namespace RegularTable {
  const TOP_LEVEL_TAGNAME = "TREE-FINDER";

  /*
   * click-related functions
   */

  export function cellClicked(metadata: MetaData): boolean {
    return typeof metadata?.y !== "undefined" && !metadata?.column_header_y;
  }

  export function columnHeaderClicked(metadata: MetaData): boolean {
    return typeof (metadata as any)?.column_header_y !== "undefined" && !!metadata?.column_header;
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
    const metadata = metadataFromElement(event.target as HTMLElement, rt, true);

    if (!metadata) {
      console.log(`event has no metadata`);
      return;
    }

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

    console.log(metadata);
  }

  /*
   * general metadata-related functions
   */

  export function metadataFromElement(target: HTMLElement, rt: RegularTableElement, recursive = true): MetaData | undefined {
    if (target.tagName === TOP_LEVEL_TAGNAME) {
      return;
    }

    let metadata = rt.getMeta(target as HTMLTableCellElement);

    if (!recursive || metadata || !target.parentElement) {
      return metadata;
    }

    return metadataFromElement(target.parentElement, rt, recursive)
  }
}

export namespace String {
  /**
   * remove all back/slashes from string
   */
  export function trimSlash(x: string) {
    return x.replace(/[\/\\]/g, "");
  }

  /**
   * remove all back/slashes, then add a trailing slash if requested to a string
   */
  export function normSlash(x: string, trailing: boolean) {
    return String.trimSlash(x) + (trailing ? "/" : "");
  }
}

export namespace Tag {
  export const html = (strings: TemplateStringsArray, ...args: any[]) => strings
    .map((str, i) => [str, args[i]])
    .flat()
    .filter((a) => !!a)
    .join("");
}

export namespace Tree {
  const treeTemplate = document.createElement("template");

  function rowHeaderLevelsHtml({isDir, isOpen, path = []}: {isDir: boolean, isOpen: boolean, path?: string[]}) {
    const tree_levels = path.slice(1).map(() => '<span class="rt-tree-group"></span>');
    if (isDir) {
      const group_icon = isOpen ? "remove" : "add";
      const tree_button = `<span class="rt-row-header-icon">${group_icon}</span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  export function rowHeaderSpan({isDir, isOpen, path, pathRender = "tree"}: {isDir: boolean, isOpen: boolean, path: string[], pathRender?: "regular" | "relative" | "tree"}): (string | HTMLSpanElement)[] {
    path = path.map((x, ix) => String.normSlash(x, ix < (path.length - 1) ? true : isDir));

    const header_classes = !isDir ? "rt-group-name rt-group-leaf" : "rt-group-name";
    const header_text = pathRender === "relative" ? path.join("") : path.slice(-1).join("");
    const tree_levels = rowHeaderLevelsHtml({isDir, isOpen, path: pathRender === "tree" ? path : []})

    treeTemplate.innerHTML = `<span class="rt-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;

    if (pathRender === "regular") {
      return [path.slice(0, -1).join(""), treeTemplate.content.firstChild] as [string, HTMLSpanElement];
    } else {
      return [treeTemplate.content.firstChild] as HTMLSpanElement[];
    }
  }

  export function breadcrumbsSpans(path: string[]): string {
    return `<div class="tf-breadcrumbs-home"><span class="tf-breadcrumbs-crumb tf-breadcrumbs-icon tf-breadcrumbs-dir-icon" data-crumbix="0">""</span><span>/</span></div>` + (
      [...path.slice(1),]
      .map((x,i) => `<span class="tf-breadcrumbs-crumb" data-crumbix="${i+1}">${x}</span>`)
      .join(`<span class="tf-breadcrumbs-separator">/</span>`)
    );
  }
}
