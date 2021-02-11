/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import "tree-finder";
import {
  mockContent,
  // TreeFinderBreadcrumbsElement,
  // TreeFinderGridElement,
  TreeFinderPanelElement,
} from "tree-finder";

import "tree-finder/style/theme/material.css";

// TreeFinderBreadcrumbsElement.get();
// TreeFinderGridElement.get();
TreeFinderPanelElement.get();

const root = mockContent({
  kind: "dir",
  path: [],
  randomize: true,
});

window.addEventListener("load", async () => {
  const treeFinder = document.createElement<typeof root>("tree-finder");
  // const treeFinder = new TreeFinderPanelElement();
  document.body.append(treeFinder);

  await treeFinder.init(
    root,
    {
      doWindowReize: true,
    }
  );
});
