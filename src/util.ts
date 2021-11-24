/**
 * Creates a duplicate-free version of an array.
 * @param array {Array} The array to inspect.
 * @returns {Array} The new duplicate free array.
 */
export const uniq = <T>(array: T[]): T[] => Array.from(new Set<T>(array));
