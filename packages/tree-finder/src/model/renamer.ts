/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Subject } from "rxjs";

import { Content, IContentRow } from "../content";
import { Path } from "../util";

export class RenamerModel<T extends IContentRow> {
  constructor(target: Content<T>, name: Path.PathArray) {
    this.target = target;

    this._name = this.target.name;
  }

  get name() {
    return this._name;
  }

  set name(name: string) {
    this._name = name;
  }

  protected _name: string;
  protected target: Content<T>;
}

export namespace RenamerModel {
  export const renamerSub = new Subject<RenamerModel<any>>();
}
