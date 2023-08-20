import { useCallback, useState } from "react";
import { debounce, has, omit } from "lodash";
import * as Yup from "yup";
import { validateYupSchema } from "../utils/validateYupSchema";
import { yupToFormErrors } from "../utils/yupToFormErrors";
import { FormErrors, FormTouched, FormValues } from "../shared/types";

type FormHookResult<T extends Record<string, any>> = {
  values: FormValues<T>;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  submitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

type FormHookProps<T extends Record<string, any>> = {
  /**
   * Initial values of the form
   */
  initialValues?: FormValues<T>;

  /** Initial object map of field names to whether the field has been touched */
  initialTouched?: FormTouched<T>;

  /** Initial object map of field names to specific error for that field */
  initialErrors?: FormErrors<T>;

  /**
   * Submission handler
   */
  onSubmit: (values: FormValues<T>) => void | Promise<any>;

  /**
   * Error handler
   */
  onError?: (errors: FormErrors<T>) => void | Promise<any>;

  /**
   * A Yup Schema or a function that returns a Yup schema
   */
  validationSchema?: Yup.ObjectSchema<T>;

  /**
   * Debounce time (in millisecond) on validating fields
   */
  debounceTimeout?: number;
};

export const useForm = <T extends Record<string, any>>({
  initialValues = {} as FormValues<T>,
  initialTouched = {} as FormTouched<T>,
  initialErrors = {} as FormErrors<T>,
  onSubmit,
  debounceTimeout,
  onError,
  validationSchema,
}: FormHookProps<T>): FormHookResult<T> => {
  const [values, setValues] = useState<FormValues<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>(initialErrors);
  const [touched, setTouched] = useState<FormTouched<T>>(initialTouched);
  const [submitting, setSubmitting] = useState(false);

  const validateField = useCallback(
    async (name: string, value: any) => {
      if (!validationSchema) return;

      try {
        await validationSchema.validateAt(name, { [name]: value });
        setErrors((prevErrors) => omit(prevErrors, name) as FormErrors<T>);
      } catch (error) {
        const fieldErrors = yupToFormErrors(error);
        setErrors((prevErrors) => ({ ...prevErrors, ...fieldErrors }));
      }
    },
    [validationSchema]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedValidateField = useCallback(
    debounce(validateField, debounceTimeout),
    [debounceTimeout, validateField]
  );

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = event.target;
      const val = type === "checkbox" ? checked : value;

      setValues((prevValues) => ({
        ...prevValues,
        [name]: val,
      }));

      const validateFN = debounceTimeout
        ? debouncedValidateField
        : validateField;

      await validateFN(name, val);
    },
    [debounceTimeout, debouncedValidateField, validateField]
  );

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (!has(touched, name)) {
      setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
    }
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitting(true);

      if (!validationSchema) {
        await onSubmit(values);
        setSubmitting(false);
        return;
      }
      try {
        await validateYupSchema(values, validationSchema);
        await onSubmit(values);
      } catch (err) {
        if (!has(err, "inner")) {
          throw new Error(
            `unexpected error occurred from onSubmit handler. ${err}`
          );
        }
        const fieldErrors = yupToFormErrors<T>(err);
        onError?.(fieldErrors);
        setErrors(fieldErrors);
        // After submission, we need to show all field errors, even those fields that have not been touched by the user.
        const errorFieldsToTouchedFieldsMap = Object.keys(fieldErrors).reduce(
          (acc, curr) => ({
            ...acc,
            [curr]: true,
          }),
          {} as FormTouched<T>
        );

        setTouched(errorFieldsToTouchedFieldsMap);
      } finally {
        setSubmitting(false);
      }
    },
    [onError, onSubmit, validationSchema, values]
  );

  return {
    values,
    errors,
    touched,
    onBlur: handleBlur,
    onChange: handleChange,
    onSubmit: handleSubmit,
    submitting,
  };
};

export default useForm;
