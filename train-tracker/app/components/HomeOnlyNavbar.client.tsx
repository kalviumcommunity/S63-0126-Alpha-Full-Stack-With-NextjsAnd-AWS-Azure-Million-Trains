"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function HomeOnlyNavbar() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return <Navbar />;
}
