import { FormValues } from "../shared/types";
import { prepareDataForValidation } from "./prepareDataForValidation";

/**
 * Validate a yup schema.
 */
export function validateYupSchema<T extends Record<string, any>>(
  values: T,
  schema: any,
  sync: boolean = false,
  context?: any
): Promise<Partial<T>> {
  const normalizedValues: FormValues<T> = prepareDataForValidation(values);

  return schema[sync ? "validateSync" : "validate"](normalizedValues, {
    abortEarly: false,
    context: context || normalizedValues,
  });
}
