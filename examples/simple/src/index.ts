/*----------------------------------------------------------------------------|
| Copyright (c) 2020, Max Klein
|
| This file is part of the tree-finder library, distributed under the terms of
| the BSD 3 Clause license. The full license can be found in the LICENSE file.
|----------------------------------------------------------------------------*/
import "tree-finder";
import { mockContent } from "tree-finder";

import "./index.css";

window.addEventListener("load", async () => {
  const treeFinder = document.createElement("tree-finder");
  document.body.append(treeFinder);

  const root = mockContent({
    kind: "dir",
    path: [],
    randomize: true,
  });
  await treeFinder.init(
    root,
    {
      doWindowReize: true,
      doRefetch: true,
    }
  );
});
