import { Suspense } from "react";
import type { Metadata } from "next";
import { Esqueleto } from "@/src/components/EstadoPraia";
import { PaginaBusca } from "@/src/components/paginas/PaginaBusca";

export const metadata: Metadata = { title: "Resultados da busca" };

// useSearchParams lê o termo da URL no navegador; o Suspense mostra o esqueleto enquanto isso.
export default function Busca() {
  return (
    <Suspense fallback={<Esqueleto />}>
      <PaginaBusca />
    </Suspense>
  );
}
