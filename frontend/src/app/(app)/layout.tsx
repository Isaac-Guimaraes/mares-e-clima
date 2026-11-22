import { AppLayout } from "@/src/components/AppLayout";
import { PraiaProvider } from "@/src/components/PraiaProvider";

/**
 * Layout compartilhado por todas as rotas do app. O PraiaProvider (estado global) fica aqui,
 * então a praia escolhida, os favoritos e as preferências continuam ao trocar de rota.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <PraiaProvider>
      <AppLayout>{children}</AppLayout>
    </PraiaProvider>
  );
}
