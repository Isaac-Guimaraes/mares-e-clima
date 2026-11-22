import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/src/components/Logo";

export const metadata: Metadata = { title: "Página não encontrada" };

/** Rota inexistente: diz o que houve e oferece o caminho de volta (heurística 9 de Nielsen). */
export default function NaoEncontrada() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-mares-fundo px-4 text-center">
      <span className="rounded-[1.25rem] bg-mares-marca px-6 py-4 text-mares-sobre-marca">
        <Logo />
      </span>
      <h1 className="titulo-tela">Página não encontrada</h1>
      <p className="max-w-md">O endereço pode ter mudado. Volte ao início para buscar sua praia.</p>
      <Link href="/" className="botao botao-primario">
        Voltar ao início
      </Link>
    </main>
  );
}
