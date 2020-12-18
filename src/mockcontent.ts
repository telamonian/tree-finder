/******************************************************************************
 *
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license.  The full license can be found in the LICENSE file.
 */
import { IContent, Path, IContentRow } from "./content";

const DIR_NAMES = [
    "able",
    "baker",
    "charlie",
    "dog",
    "easy",
    "fox",
    "george",
    "how",
    "item",
    "jig",
    "king",
    "love",
    "mike",
    "nan",
    "oboe",
    "peter",
    "queen",
    "roger",
    "sugar",
    "tare",
    "uncle",
    "victor",
    "william",
    "xray",
    "yoke",
    "zebra",
];

const CONTENTS_CACHE = new Map();

type Kind = "dir" | "file";
interface IMockContentRow extends IContentRow {
    modified: Date;

    kind: Kind;

    writable: boolean;
}
type IMockContent = IContent<IMockContentRow>

export function mockContent(path: Path, expand?: boolean, nchildren: number = 100, ndirectories: number = 10) {
    // infinite recursive mock contents
    const key = path.join("");

    let content: IMockContent;
    if (CONTENTS_CACHE.has(key)) {
        content = CONTENTS_CACHE.get(key);
    } else {
        content = {
            row: {
                path,
                modified: new Date(12 * 60 * 60 * 1000),
                kind: "dir",
                writable: false,
            },
            expanded: false,
        };
        CONTENTS_CACHE.set(key, content);
    }

    if (!expand || "children" in content) {
        // do nothing further
        return content;
    }

    content.expanded = true;
    content.children = [];
    for (let i = 0; i < nchildren; i++) {
        const child = {
            children: [],
            row: {
                path: [...path, i < ndirectories ? `${DIR_NAMES[i]}/` : `file_${i - ndirectories}.txt`],
                modified: new Date(content.row.modified.getTime() + 24 * 60 * 60 * 1000 * (365 + i)),
                kind: i < ndirectories ? "dir" : "text" as Kind,
                writable: false,
            },
            expanded: false,
        };

        CONTENTS_CACHE.set(child.row.path.join(""), child);
        content.children.push(child);
    }

    return content;
}
