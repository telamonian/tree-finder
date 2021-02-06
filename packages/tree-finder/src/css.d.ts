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
