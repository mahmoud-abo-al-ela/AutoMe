import React from "react";
import CreateCarForm from "../_components/car-forms/CreateCarForm";

export const metadata = {
  title: "Create Car | AutoMe Admin",
  description: "Create a new car",
};

const CreateCarPage = () => {
  return (
    <div className="p-6">
      <CreateCarForm />
    </div>
  );
};

export default CreateCarPage;
