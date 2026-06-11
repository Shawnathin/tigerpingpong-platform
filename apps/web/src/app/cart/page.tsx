import type { Metadata } from "next";

import { PublicStorefrontNav } from "../PublicStorefrontNav";

import { CartPageClient } from "./CartPageClient";

export const metadata: Metadata = {
  title: "Cart | Tiger Ping Pong",
  description: "Review your Tiger Ping Pong cart before Stripe Checkout."
};

export default function CartPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="cart" />
      <CartPageClient />
    </>
  );
}
