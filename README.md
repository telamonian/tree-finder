<p align="center">
    <img alt="tree-finder" src="https://raw.githubusercontent.com/telamonian/tree-finder/master/packages/tree-finder/style/icons/treeFinder.svg" width="300">
</p>


<p align="center">
  <h1 algin="center">tree-finder</h1>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tree-finder"><img alt="NPM Version" src="https://img.shields.io/npm/v/tree-finder.svg?color=brightgreen&style=flat-square"></a>
</p>

A Javascript library for the browser, `tree-finder` exports
a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
named `<tree-finder>`,
which can be used to easily render filebrowers or other hierarchical trees. Only visible cells are rendered.

## Examples

||
|:--|
|basic|
|[![basic](https://raw.githubusercontent.com/telamonian/tree-finder/master/docs/basic_example.png)](https://bl.ocks.org/telamonian/330781ee64e02c514081851d272cd0a6)|

## Installation

Include via a CDN like [JSDelivr](https://cdn.jsdelivr.net/npm/tree-finder):

```html
  <script src="https://cdn.jsdelivr.net/npm/tree-finder/dist/tree-finder.js"></script>
  <link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/tree-finder/dist/main.css">
  <link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/tree-finder/style/theme/material.css">
```

Or, add to your project via `yarn`:

```bash
yarn add tree-finder
```

... then import into your asset bundle.

```javascript
import "tree-finder";
import "tree-finder/style/theme/material.css";
```
