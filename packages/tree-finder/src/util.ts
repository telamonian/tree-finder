/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { MetaData, RegularTableElement } from "regular-table";

export namespace Format {
  export const DATE_FORMATTER = new Intl.DateTimeFormat("en-us");

  /**
   * Format bytes as human-readable text.
   * ref: https://stackoverflow.com/a/14919494
   *
   * @param bytes Number of bytes.
   * @param si True to use metric (SI) units, aka powers of 1000. False to use
   *           binary (IEC), aka powers of 1024.
   * @param dp Number of decimal places to display.
   *
   * @return Formatted string.
   */
  export function bytesToHumanReadable(bytes: number, si=false, dp=1) {
    if (!bytes) {
      return "--";
    }

    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
      return bytes + " B";
    }

    const units = si
      ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
      : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    let u = -1;
    const r = 10**dp;

    do {
      bytes /= thresh;
      ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
  }

  export function dateToStr(date: Date, str: string) {
    return DATE_FORMATTER.format(date).includes(str);
  }

  export function timeSince(date: Date | string) {
    date = !(date instanceof Date) ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - date.valueOf())/1000);
    let interval = seconds/31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds/2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds/86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds/3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds/60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }
}

export namespace RegularTable {
  const TOP_LEVEL_TAGNAME = "TREE-FINDER-GRID";

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

  export function colNameFromMeta(meta: MetaData): string {
    const {column_header, value} = meta;
    return (value instanceof HTMLElement ? value.textContent : column_header as any === "0" ? "path" : value)! as string;
  }

  export function metadataFromElement(target: Element, rt: RegularTableElement, recursive = true): MetaData | undefined {
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

export namespace Path {
  export type PathArray = string[];

  export function equal(l: PathArray, r: PathArray) {
    return l.length === r.length && l.every((lvalue, i) => lvalue === r[i]);
  }

  export function fromarray(x: PathArray): string {
    const [first, ...rest] = x;
    const drive = first ? first + ":" : "";
    const local = rest.join("/");

    return `${drive}${local}`;
  }

  export function toarray(x: string): PathArray {
    const splits = x.split(/:/g);
    const [drive, local] = splits.length >= 2 ? splits : ["", x];

    return [drive, ...(local ? local.split(/[\/\\]/g) : [])];
  }

  /**
   * remove all back/slashes, then add a trailing slash if requested to a string
   */
  export function normSlash(x: string, trailing: boolean) {
    return Path.trimSlash(x) + (trailing ? "/" : "");
  }

  /**
   * remove all back/slashes from string
   */
  export function trimSlash(x: string) {
    return x.replace(/[\/\\]/g, "");
  }
}

export namespace Tag {
  export const html = (strings: TemplateStringsArray, ...args: any[]) => strings
    .map((str, i) => [str, args[i]])
    .flat()
    .filter((a) => !!a)
    .join("");

  /**
   * for generating element attributes in html markup
   */
  type attrSpec = {key: string, values: (boolean | string)[]};
  export const attrs = (specs: attrSpec[]) => {
    return specs.map(s => {
      const value = s.values.filter(x => x).join(" ");
      return value ? ` ${s.key}="${value}"` : "";
    }).join("");
  }
}

export namespace Trait {
  export type Keyof<T> = Exclude<keyof T, number>;
}

export namespace Tree {
  const treeTemplate = document.createElement("template");
  const inputSpanTemplate = document.createElement("template");
  const nameSpanTemplate = document.createElement("template");

  export function breadcrumbsSpans(path: string[]): string {
    return `<div class="tf-breadcrumbs-home"><span class="tf-breadcrumbs-crumb tf-breadcrumbs-icon tf-breadcrumbs-dir-icon" data-crumbix="0"></span><span>/</span></div>` + (
      [...path.slice(1),]
      .map((x,i) => `<span class="tf-breadcrumbs-crumb" data-crumbix="${i+1}">${x}</span>`)
      .join(`<span class="tf-breadcrumbs-separator">/</span>`)
    );
  }

  export function colHeaderSpans(name: string, filter: boolean = false) {
    nameSpanTemplate.innerHTML = `<span class="tf-header"><span class="tf-header-name">${name}</span><span class="tf-header-sort"></span></span>`;

    if (filter) {
      inputSpanTemplate.innerHTML = `<input class="tf-header-input"></input>`;
      return [inputSpanTemplate.content.firstChild!, nameSpanTemplate.content.firstChild!];
    } else {
      return [nameSpanTemplate.content.firstChild!];
    }
  }

  function rowHeaderLevelsHtml({isDir, isOpen, path = []}: {isDir: boolean, isOpen: boolean, path?: string[]}) {
    const tree_levels = path.slice(1).map(() => '<span class="rt-tree-group"></span>');
    if (isDir) {
      const group_icon = isOpen ? "remove" : "add";
      const tree_button = `<span class="rt-row-header-icon">${group_icon}</span>`;
      tree_levels.push(tree_button);
    }

    return tree_levels.join("");
  }

  export function rowHeaderSpan({isDir, isExpand: isOpen, path, editable = false, pathRender = "tree"}: {isDir: boolean, isExpand: boolean, path: string[], editable?: boolean, pathRender?: "regular" | "relative" | "tree"}): ([HTMLSpanElement] | [string, HTMLSpanElement]) {
    // normalize forward/backslash usage in path parts, and ensure that all dirs have a trailing forward slash
    path = path.map((x, ix) => Path.normSlash(x, ix < (path.length - 1) || isDir));

    const header_attrs = Tag.attrs([
      {key: "class", values: ["rt-group-name", !isDir && "rt-group-leaf", editable && "tf-mod-editable"]},
    ]);
    const header_text = pathRender === "relative" ? path.join("") : path.slice(-1).join("");
    const tree_levels = rowHeaderLevelsHtml({isDir, isOpen, path: pathRender === "tree" ? path : []})

    treeTemplate.innerHTML = `<span class="rt-tree-container">${tree_levels}<span${header_attrs}>${header_text}</span></span>`;

    if (pathRender === "regular") {
      return [path.slice(0, -1).join(""), treeTemplate.content.firstChild!] as [string, HTMLSpanElement];
    } else {
      return [treeTemplate.content.firstChild!] as [HTMLSpanElement];
    }
  }
}
