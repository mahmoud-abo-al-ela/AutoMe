import Footer from "@/components/Footer";
import MainHeader from "@/components/Header/MainHeader";
import React from "react";

const layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <MainHeader />
      <main className="flex justify-center py-30 flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default layout;
