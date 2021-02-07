/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { MetaData, RegularTableElement } from "regular-table";
import {Template} from "webpack";

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

export namespace Tag {
  export const html = (strings: TemplateStringsArray, ...args: any[]) => strings
    .map((str, i) => [str, args[i]])
    .flat()
    .filter((a) => !!a)
    .join("")
    .replace(/>\s*\n\s*</g, '><')
    .replace(/\s*\n\s*/g, ' ');
}

export namespace Tree {
  const treeTemplate = document.createElement("template");

  function rowHeaderLevelsHtml({isDir, isOpen, path}: {isDir: boolean, isOpen: boolean, path: string[]}) {
    const tree_levels = path.slice(1).map(() => '<span class="rt-tree-group"></span>');
    if (isDir) {
      const group_icon = isOpen ? "remove" : "add";
      const tree_button = `<span class="rt-row-header-icon">${group_icon}</span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  export function rowHeaderSpan({isDir, isOpen, path}: {isDir: boolean, isOpen: boolean, path: string[]}): HTMLSpanElement {
    const tree_levels = rowHeaderLevelsHtml({isDir, isOpen, path});
    const header_classes = !isDir ? "rt-group-name rt-group-leaf" : "rt-group-name";
    const header_text = path.length === 0 ? "TOTAL" : path[path.length - 1];

    treeTemplate.innerHTML = `<span class="rt-tree-container">${tree_levels}<span class="${header_classes}">${header_text}</span></span>`;
    return treeTemplate.content.firstChild as HTMLSpanElement;
  }

  export function breadcrumbsSpans(path: string[]): string {
    return [
      `<span class="tf-breadcrumbs-icon tf-breadcrumbs-dir-icon"></span>`,
      ...path.slice(1),
    ]
    .map(x => `<span class="tf-breadcrumbs-crumb">${x}</span>`)
    .join(`<span class="tf-breadcrumbs-separator">/</span>`);
  }
}
