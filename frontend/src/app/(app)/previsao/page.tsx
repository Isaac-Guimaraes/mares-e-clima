import type { Metadata } from "next";
import { PaginaPrevisao } from "@/src/components/paginas/PaginaPrevisao";

export const metadata: Metadata = { title: "Previsão" };

export default function Previsao() {
  return <PaginaPrevisao />;
}
