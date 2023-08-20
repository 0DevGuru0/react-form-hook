import { FormValues } from "../types";
import { prepareDataForValidation } from "./prepareDataForValidation";

/**
 * Validate a yup schema.
 */
export function validateYupSchema<T extends FormValues>(
  values: T,
  schema: any,
  sync: boolean = false,
  context?: any
): Promise<Partial<T>> {
  const normalizedValues: FormValues = prepareDataForValidation(values);

  return schema[sync ? "validateSync" : "validate"](normalizedValues, {
    abortEarly: false,
    context: context || normalizedValues,
  });
}
