export type FormValues = Record<string, any>;

/**
 * An object containing error messages whose keys correspond to FormValues.
 * Should always be an object of strings, but any is allowed to support i18n libraries.
 */
export type FormErrors<Values> = {
  [K in keyof Values]?: Values[K] extends any[]
    ? Values[K][number] extends object // [number] is the special sauce to get the type of array's element. More here https://github.com/Microsoft/TypeScript/pull/21316
      ? FormErrors<Values[K][number]>[] | string | string[]
      : string | string[]
    : Values[K] extends object
    ? FormErrors<Values[K]>
    : string;
};
