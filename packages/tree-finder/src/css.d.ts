/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
// for pure css
declare module '*.css' {
  const classes: {[key: string]: string};
  export default classes;
}

// for less
declare module "*.less" {
  const classes: {[key: string]: string};
  export default classes;
}

// for scss
declare module "*.scss" {
  const classes: {[key: string]: string};
  export default classes;
}
