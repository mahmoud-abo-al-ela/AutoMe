import React from "react";
import FeaturedCard from "./FeaturedCard";
const Featured = ({
  title = "Featured Cars",
  subtitle = "Explore our curated selection of premium vehicles",
}) => {
  return <FeaturedCard title={title} subtitle={subtitle} />;
};

export default Featured;
