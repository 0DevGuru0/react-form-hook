import * as Yup from "yup";
import useForm from "../hooks/useForm";

const validationSchema = Yup.object().shape({
  name: Yup.string().required().min(5),
  email: Yup.string().email("Invalid email").required("Email is required"),
});

export const UncontrolledForm: React.FC = () => {
  const { errors, onSubmit, onChange, submitting, onBlur, touched } = useForm({
    validationSchema,
    onSubmit: (submittedValues) => {
      console.log("Form submitted successfully!");
      console.log("Values:", submittedValues);
    },
    onError: (errors) => {
      console.log("Form has errors:", errors);
    },
    debounceTimeout: 30,
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>
          Name:
          <input name="name" type="text" onChange={onChange} onBlur={onBlur} />
        </label>
        {errors.name && touched.name && <span>{errors.name}</span>}
      </div>
      <div>
        <label>
          Email:
          <input
            name="email"
            type="email"
            onChange={onChange}
            onBlur={onBlur}
          />
        </label>
        {errors.email && touched.email && <span>{errors.email}</span>}
      </div>
      <button type="submit" disabled={submitting}>
        Submit
      </button>
    </form>
  );
};

export default UncontrolledForm;
