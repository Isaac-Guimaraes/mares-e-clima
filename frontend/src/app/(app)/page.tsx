import type { Metadata } from "next";
import { PaginaInicio } from "@/src/components/paginas/PaginaInicio";

export const metadata: Metadata = { title: { absolute: "Marés e Clima · A hora certa de ir à praia" } };

export default function Inicio() {
  return <PaginaInicio />;
}
