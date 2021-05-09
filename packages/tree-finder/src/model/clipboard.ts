/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Subject } from "rxjs";

import { IContentRow } from "../content";
import { ContentsModel } from "./model";

export class ClipboardModel<T extends IContentRow> implements ClipboardModel.IClipboardModel<T> {

  /**
   * low-level ccp support functions
   */

  copy(memo: T[]) {
    this.memo = memo;
    this.copySub.next(memo);
  }

  cut(memo: T[]) {
    this.memo = memo;
    this.cutSub.next(memo);
  }

  paste(destination: T) {
    this.pasteSub.next({
      destination,
      memo: this.memo,
    });
  }

  /**
   * sugar for ccp from selection. contentsModel is left as a free variable
   * to facilitate copying from one contentsModel to another
   */

  copySelection(contentsModel: ContentsModel<T>) {
    this.copy(contentsModel.selection.map(x => x.row));
  }

  cutSelection(contentsModel: ContentsModel<T>) {
    this.cut(contentsModel.selection.map(x => x.row));
  }

  pasteSelection(contentsModel: ContentsModel<T>) {
    const row = contentsModel.lastSelected?.row;
    if (row) {
      this.paste(row);
    }
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
  export interface IClipboardModel<T extends IContentRow> {
    copy(memo: T[]): void;
    cut(memo: T[]): void;
    paste(destination: T): void;

    readonly copySub: Subject<T[]>;
    readonly cutSub: Subject<T[]>;
    readonly pasteSub: Subject<{
      destination: T;
      memo: T[];
    }>;
  }
}
