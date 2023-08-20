import { toPath } from "lodash";

/**
 * Deeply get a value from an object via its path.
 */
export function getIn(
  obj: any,
  key: string | string[],
  def?: any,
  p: number = 0
) {
  const path = toPath(key);
  while (obj && p < path.length) {
    obj = obj[path[p++]];
  }

  // check if path is not in the end
  if (p !== path.length && !obj) {
    return def;
  }

  return obj === undefined ? def : obj;
}
