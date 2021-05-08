/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Subject } from "rxjs";

import { IContentRow } from "../content";

export class ClipboardModel<T extends IContentRow> {
  copy(...memo: T[]) {
    this.memo = memo;
    this.copySub.next(memo);
  }

  cut(...memo: T[]) {
    this.memo = memo;
    this.cutSub.next(memo);
  }

  paste(destination: T) {
    this.pasteSub.next({
      destination,
      memo: this.memo,
    });
  }

  readonly copySub = new Subject<T[]>();
  readonly cutSub = new Subject<T[]>();
  readonly pasteSub = new Subject<{
    destination: T;
    memo: T[];
  }>();

  protected memo: T[] = [];
}

export namespace ClipboardModel {
  export const renamerSub = new Subject<ClipboardModel<any>>();
}
