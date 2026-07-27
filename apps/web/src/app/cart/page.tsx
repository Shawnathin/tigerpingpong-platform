import type { Metadata } from "next";

import { tigerCartStory } from "../../lib/tiger-story";
import { PublicStorefrontFooter } from "../PublicStorefrontFooter";
import { PublicStorefrontNav } from "../PublicStorefrontNav";

import { CartPageClient } from "./CartPageClient";

export const metadata: Metadata = {
  title: "Cart | Tiger PingPong",
  robots: {
    index: false,
    follow: true
  }
};

export default function CartPage() {
  return (
    <>
      <PublicStorefrontNav activeItem="cart" />
      <CartPageClient emptyStateStory={tigerCartStory.empty} />
      <PublicStorefrontFooter />
    </>
  );
}
