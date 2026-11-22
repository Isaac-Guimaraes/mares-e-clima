import type { Metadata } from "next";
import { PaginaAjustes } from "@/src/components/paginas/PaginaAjustes";

export const metadata: Metadata = { title: "Ajustes" };

export default function Ajustes() {
  return <PaginaAjustes />;
}
