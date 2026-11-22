import type { Metadata } from "next";
import { PaginaHoje } from "@/src/components/paginas/PaginaHoje";

export const metadata: Metadata = { title: "Hoje" };

export default function Hoje() {
  return <PaginaHoje />;
}
