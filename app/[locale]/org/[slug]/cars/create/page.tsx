import React from "react";
import type { Metadata } from "next";
import CreateCarForm from "../_components/car-forms/CreateCarForm";

export const metadata: Metadata = {
  title: "Create Car",
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
