/**
 * The random numbers of the test-data generators (`/generate`).
 *
 * With a seed, the numbers come from mulberry32, a small 32-bit generator
 * that uses only integer operations (`Math.imul`, shifts and XOR) and one
 * division by a power of two, which JavaScript defines exactly. So the same
 * seed gives the same sequence on every platform and every engine. Nothing
 * here reads `Math.random`, the clock or the environment when a seed is
 * given.
 *
 * Without a seed, the numbers come from `Math.random`.
 */

/** A source of numbers in [0, 1), like `Math.random`. */
export type Random = () => number;

/** 2^32: turns a 32-bit unsigned integer into a number in [0, 1). */
const TWO_POW_32 = 4294967296;

/**
 * mulberry32 (Tommy Ettinger, public domain): from a 32-bit seed, a
 * function that returns the next number in [0, 1) at each call. The state
 * is kept in an int32, so it never grows past what a double holds exactly,
 * however many numbers are drawn.
 */
export function mulberry32(seed: number): Random {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO_POW_32;
  };
}

/**
 * The random source of a seeded generator. A seed must be an integer; it is
 * reduced modulo 2^32, so `0` and `2 ** 32` give the same sequence. Anything
 * else (a float, `NaN`, a string) is a programming error and throws a
 * `RangeError`.
 */
export function seeded(seed: unknown): Random {
  if (typeof seed !== "number" || !Number.isInteger(seed))
    throw new RangeError(`seed must be an integer, got ${describe(seed)}.`);
  return mulberry32(seed >>> 0);
}

/**
 * The random source of a generator call: mulberry32 when a `seed` is given,
 * `Math.random` when it is `undefined`.
 */
export function randomFor(seed: unknown): Random {
  return seed === undefined ? Math.random : seeded(seed);
}

/** A short description of a bad argument for an error message. */
export function describe(value: unknown): string {
  return typeof value === "symbol" ? "a symbol" : String(value);
}

/** An integer from 0 up to, and not including, `limit`. */
export function nextInt(random: Random, limit: number): number {
  return Math.floor(random() * limit);
}

/** One element of a non-empty array. */
export function pick<T>(random: Random, items: readonly T[]): T {
  return items[nextInt(random, items.length)] as T;
}

/** One character of a non-empty string. */
export function pickChar(random: Random, chars: string): string {
  return chars.charAt(nextInt(random, chars.length));
}

/** `n` left-padded with zeros to `length` digits. */
export function pad(n: number, length: number): string {
  let digits = String(n);
  while (digits.length < length) digits = `0${digits}`;
  return digits;
}
