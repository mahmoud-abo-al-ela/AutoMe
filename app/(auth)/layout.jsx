import Footer from "@/components/Footer";
import MainHeader from "@/components/Header/MainHeader";
import React from "react";

const layout = ({ children }) => {
  return (
    <>
      <MainHeader />
      <main className="flex justify-center  py-40">{children}</main>
      <Footer />
    </>
  );
};

export default layout;
