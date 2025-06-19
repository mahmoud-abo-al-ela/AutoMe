import React from "react";

const FormSection = ({ title, children }) => (
  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
    <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-base justify-center sm:justify-start">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

export default FormSection;
