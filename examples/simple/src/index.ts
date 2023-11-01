/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import "@tree-finder/base";
import { mockContent } from "@tree-finder/mockcontents";

import "../style";

const root = mockContent({
  kind: "dir",
  path: [],
  randomize: true,
});

window.addEventListener("load", async () => {
  const treeFinder = document.createElement<typeof root>("tree-finder-panel");
  // const treeFinder = new TreeFinderPanelElement();
  document.body.append(treeFinder);

  await treeFinder.init({
    root,
    gridOptions: {
      doWindowResize: true,
      showFilter: true,
    },
  });
});
