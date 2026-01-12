"use client";

import { WishlistPresenter } from "./_components/WishlistPresenter";
import { useWishlistPage } from "@/hooks/use-wishlist-page";

const WishlistPage = () => {
  const pageData = useWishlistPage();

  return <WishlistPresenter {...pageData} />;
};

export default WishlistPage;
