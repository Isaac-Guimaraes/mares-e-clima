import type { Metadata } from "next";
import { PaginaHoraAHora } from "@/src/components/paginas/PaginaHoraAHora";

export const metadata: Metadata = { title: "Hora a hora" };

export default function HoraAHora() {
  return <PaginaHoraAHora />;
}
