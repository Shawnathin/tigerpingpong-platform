import type { Metadata } from "next";

import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";

import { CartPageClient } from "./CartPageClient";

export const metadata: Metadata = {
  title: "Cart | Tiger Ping Pong",
  robots: {
    index: false,
    follow: true
  }
};

export default function CartPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="cart" />
      <CartPageClient />
      <PublicStorefrontFooter />
    </>
  );
}
