import { isPlainObject } from "lodash";
import { FormValues } from "../types";

/**
 * Recursively prepare values.
 */
export function prepareDataForValidation<T extends FormValues>(
  values: T
): FormValues {
  let data: FormValues = Array.isArray(values) ? [] : {};
  for (let k in values) {
    if (Object.prototype.hasOwnProperty.call(values, k)) {
      const key = String(k);
      if (Array.isArray(values[key]) === true) {
        data[key] = values[key].map((value: any) => {
          if (Array.isArray(value) === true || isPlainObject(value)) {
            return prepareDataForValidation(value);
          } else {
            return value !== "" ? value : undefined;
          }
        });
      } else if (isPlainObject(values[key])) {
        data[key] = prepareDataForValidation(values[key]);
      } else {
        data[key] = values[key] !== "" ? values[key] : undefined;
      }
    }
  }
  return data;
}
