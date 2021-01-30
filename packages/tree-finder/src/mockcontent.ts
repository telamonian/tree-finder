/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import { Path, IContentRow } from "./content";

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

interface IMockContentRow extends IContentRow {
  modified: Date;

  writable: boolean;
}

export function mockContent(props: {path: Path, kind: string, modDays?: number, nchildren?: number, ndirectories?: number}): IMockContentRow {
  // infinite recursive mock contents
  const {path, kind, modDays = 0, nchildren = 100, ndirectories = 10} = props;
  const modified = new Date(modDays * 24 * 60 * 60 * 1000);

  let content: IMockContentRow;
  if (kind === "dir") {
    // is a dir
    content = {
      kind,
      path,
      modified,
      writable: false,
      getChildren: () => {
        const children = [];
        for (let i = 0; i < nchildren; i++) {
          children.push(mockContent({
            kind: i < ndirectories ? "dir" : "text",
            path: [...path, i < ndirectories ? `${DIR_NAMES[i]}/` : `file_${i - ndirectories}.txt`],
            modDays: modDays + i,
          }));
        }
        return children;
      },
    };
  } else {
    // is a file
    content = {
      kind,
      path,
      modified,
      writable: false,
    };
  }

  return content;
}
