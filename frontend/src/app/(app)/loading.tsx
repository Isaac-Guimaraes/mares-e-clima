import { Esqueleto } from "@/src/components/EstadoPraia";

/** LOADING de rota (Next.js): aparece enquanto o código de uma rota ainda está chegando. */
export default function Carregando() {
  return (
    <div aria-busy="true" className="space-y-3">
      <p className="font-semibold">Carregando…</p>
      <Esqueleto />
    </div>
  );
}
