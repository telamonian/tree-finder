/*
 * Copyright (c) 2020, Max Klein
 *
 * This file is part of the tree-finder library, distributed under the terms of
 * the BSD 3 Clause license. The full license can be found in the LICENSE file.
 */
export namespace Random {
  export function bool() {
    return Math.random() < 0.5;
  }

  // randomize array in-place using Durstenfeld shuffle algorithm
  // ref: https://stackoverflow.com/a/12646864
  export function shuffle<T>(arr: T[], inPlace: boolean = false) {
    arr = inPlace ? arr : [...arr];

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  }
}

/**
 * ref: https://en.wikipedia.org/wiki/Allied_military_phonetic_spelling_alphabets
 */
export const ALLIED_PHONETIC = [
  "able",
  "baker",
  "charlie",
  "dog",
  "easy",
  "fox",
  "george",
  "how",
  "item",
  "jig",
  "king",
  "love",
  "mike",
  "nan",
  "oboe",
  "peter",
  "queen",
  "roger",
  "sugar",
  "tare",
  "uncle",
  "victor",
  "william",
  "xray",
  "yoke",
  "zebra",
];
