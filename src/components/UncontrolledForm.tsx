import * as Yup from "yup";
import useForm from "../hooks/useForm";

export const UncontrolledForm: React.FC = () => {
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  const { errors, onSubmit, onChange } = useForm({
    initialValues: { name: "", email: "" },
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
          <input name="name" type="text" onChange={onChange} />
        </label>
        {errors.name && <span>{errors.name}</span>}
      </div>
      <div>
        <label>
          Email:
          <input name="email" type="email" onChange={onChange} />
        </label>
        {errors.email && <span>{errors.email}</span>}
      </div>
      <button type="submit">Submit</button>
    </form>
  );
};

export default UncontrolledForm;
