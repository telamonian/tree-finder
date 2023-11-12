<p align="center">
  <img alt="tree-finder" src="https://raw.githubusercontent.com/telamonian/tree-finder/master/packages/tree-finder/style/icons/treeFinder.svg" width="300">
</p>


<p align="center">
  <h1 align="center">tree-finder</h1>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tree-finder"><img alt="NPM Version" src="https://img.shields.io/npm/v/tree-finder.svg?color=brightgreen&style=flat-square"></a>
</p>

A Javascript library for the browser, [`tree-finder`](https://github.com/telamonian/tree-finder) exports
a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
named `<tree-finder>`,
which can be used to easily render filebrowers or other hierarchical trees. Only visible cells are rendered.

## Features

- [x] lazy data model and virtualized rendering -> can support billions of rows
- [x] tree-like columns
- [x] multi-sort
- [x] multi-selection
- [x] multi-filter
- [x] built in breadcrumbs
- [x] full clipboard model, with support for copy/cut/paste between multiple `<tree-finder>` instances
- [ ] command hooks to support 3rd party integrations
  - [ ] basic actions
    - [x] open
    - [x] delete
    - [ ] rename
    - [x] copy
    - [x] cut
    - [x] paste
  - [x] integration of command hooks with selection model
- [ ] icon support
  - [ ] icons-as-svg-elements
  - [ ] icons-as-css-classes
- [ ] drag-n-drop

## Examples - try `<tree-finder>` out live

||
|:--|
|basic|
|[![basic](https://raw.githubusercontent.com/telamonian/tree-finder/master/docs/basic_example.png)](https://bl.ocks.org/telamonian/330781ee64e02c514081851d272cd0a6)|

## Installation

Include via a CDN like [JSDelivr](https://cdn.jsdelivr.net/npm/tree-finder):

```html
  <script src="https://cdn.jsdelivr.net/npm/@tree-finder/base/dist/tree-finder.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tree-finder/base/dist/tree-finder.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tree-finder/base/dist/theme/material.css">
```

Or, add to your project via `yarn`:

```bash
yarn add @tree-finder/base
```

... then import into your asset bundle.

```javascript
import "@tree-finder/base";
import "@tree-finder/base/style/theme/material.css";
```

## Development

- First, ensure that you have `nodejs >= 12.0.0` and `yarn >= v1.2.0` installed
- Clone this repo
- Build and run the "simple" example
  ```bash
  cd examples/simple
  yarn
  yarn start
  ```

`yarn start` will launch a dev server. Open the url it supplies in any browser in order to view the example. While the dev server is running, any changes you make to the source code (ie any `.ts` or `.less` files) will trigger a rebuild, and the example will automatically reload in your browser.
