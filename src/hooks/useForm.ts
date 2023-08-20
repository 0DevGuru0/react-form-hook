import { useCallback, useState } from "react";
import { debounce, has, omit } from "lodash";
import * as Yup from "yup";
import { validateYupSchema } from "../utils/validateYupSchema";
import { yupToFormErrors } from "../utils/yupToFormErrors";
import { FormErrors } from "../types";

type FormValues<T extends Record<string, any>> = {
  [K in keyof T]: T[K];
};

type FormTouched<T> = {
  [K in keyof T]: boolean;
};

type FormHookResult<T extends Record<string, any>> = {
  values: FormValues<T>;
  errors: FormErrors<T>;
  touched: FormTouched<T>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

type FormHookProps<T extends Record<string, any>> = {
  /**
   * Initial values of the form
   */
  initialValues: FormValues<T>;

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
   * Debounce on validating fields
   */
  debounceTimeout?: number;
};

export const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  debounceTimeout,
  onError,
  validationSchema,
}: FormHookProps<T>): FormHookResult<T> => {
  const [values, setValues] = useState<FormValues<T>>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({} as FormTouched<T>);

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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = event.target;
      const val = type === "checkbox" ? checked : value;

      setValues((prevValues) => ({
        ...prevValues,
        [name]: val,
      }));

      const validateFN = debounceTimeout
        ? debouncedValidateField
        : validateField;

      validateFN(name, val);
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
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validationSchema) {
        onSubmit(values);
        return;
      }

      validateYupSchema(values, validationSchema)
        .then(() => onSubmit(values))
        .catch((err) => {
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
        });
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
  };
};

export default useForm;
