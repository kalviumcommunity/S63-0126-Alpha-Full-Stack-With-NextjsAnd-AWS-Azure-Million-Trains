import type { ReactElement } from "react";
import HeroVideo from "./components/HeroVideo.client";

export const revalidate = false;

export default function HomePage(): ReactElement {
  return (
    <>
      <HeroVideo />
    </>
  );
}
