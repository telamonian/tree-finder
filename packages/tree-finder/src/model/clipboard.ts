/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
import { Subject } from "rxjs";

import { IContentRow } from "../content";
import { ContentsModel } from "./model";

export class ClipboardModel implements ClipboardModel.IClipboardModel {
  /**
   * low-level ccp support functions
   */
  copy<T extends IContentRow>(memo: T[]) {
    this.doCut = false;
    this.memo = memo;
    this.copySub.next(memo);
  }

  cut<T extends IContentRow>(memo: T[]) {
    this.doCut = true;
    this.memo = memo;
    this.cutSub.next(memo);
  }

  delete<T extends IContentRow>(memo: T[]) {
    this.deleteSub.next(memo);
  }

  paste<T extends IContentRow>(destination: T) {
    this.pasteSub.next({
      destination,
      doCut: this.doCut,
      memo: this.memo,
    });

    this.doCut = false;
  }

  /**
   * sugar for ccp from selection. contentsModel is left as a free variable
   * to facilitate copying from one contentsModel to another
   */
  copySelection<T extends IContentRow>(contentsModel: ContentsModel<T>) {
    this.copy(contentsModel.selection.map(x => x.row));
  }

  cutSelection<T extends IContentRow>(contentsModel: ContentsModel<T>) {
    this.cut(contentsModel.selection.map(x => x.row));
  }

  deleteSelection<T extends IContentRow>(contentsModel: ContentsModel<T>) {
    this.delete(contentsModel.selection.map(x => x.row));
  }

  pasteSelection<T extends IContentRow>(contentsModel: ContentsModel<T>) {
    const row = contentsModel.selectedLast?.row ?? contentsModel.root.row;
    if (row) {
      this.paste(row);
    }
  }

  readonly copySub = new Subject<IContentRow[]>();
  readonly cutSub = new Subject<IContentRow[]>();
  readonly deleteSub = new Subject<IContentRow[]>();
  readonly pasteSub = new Subject<ClipboardModel.IPaste>();

  protected doCut: boolean = false;
  protected memo: IContentRow[] = [];
}

export namespace ClipboardModel {
  export interface IClipboardModel {
    copy<T extends IContentRow>(memo: T[]): void;
    cut<T extends IContentRow>(memo: T[]): void;
    delete<T extends IContentRow>(memo: T[]): void;
    paste<T extends IContentRow>(destination: T): void;

    readonly copySub: Subject<IContentRow[]>;
    readonly cutSub: Subject<IContentRow[]>;
    readonly deleteSub: Subject<IContentRow[]>;
    readonly pasteSub: Subject<IPaste>;
  }

  export interface IPaste {
    destination: IContentRow;
    doCut: boolean;
    memo: IContentRow[];
  }
}
