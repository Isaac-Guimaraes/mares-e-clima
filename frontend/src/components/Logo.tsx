/**
 * Símbolo do Manual de Identidade Visual (p. 4): sol nascendo sobre a maré, em quadrado arredondado.
 * As cores fixas aqui são do próprio desenho da marca, não da interface.
 */
export function SimboloMarca({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={`shrink-0 ${className}`}>
      <defs>
        <clipPath id="recorte-simbolo">
          <rect width="120" height="120" rx="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#recorte-simbolo)">
        <rect width="120" height="120" fill="#ffffff" />
        <circle cx="62" cy="62" r="24" fill="#f5b335" />
        <path d="M0 72c20-12 40-12 60 0s40 12 60 0v48H0z" fill="#1a6fa0" />
        <path d="M-4 88c21-12 42-12 64 0s43 12 64 0" fill="none" stroke="#7fd1d9" strokeWidth="8" />
      </g>
    </svg>
  );
}

/** Versão negativa do logotipo (sobre Oceano): nome em branco e destaque em Água. */
export function Logo() {
  return (
    <span className="flex items-center gap-2 sm:gap-3">
      <SimboloMarca className="size-8 sm:size-10" />
      <span className="font-titulo text-lg leading-none font-black whitespace-nowrap sm:text-xl">
        Marés e <span className="text-mares-agua">Clima</span>
      </span>
    </span>
  );
}

/** Grafismo de ondas (manual, p. 9): linhas em Água e Maré com o ponto de Sol. Decorativo. */
export function GrafismoOndas({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 160" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path d="M0 40c100-40 200-40 300 0s200 40 300 0 150-30 200-10" fill="none" stroke="#7fd1d9" strokeWidth="6" />
      <path d="M0 90c100-40 200-40 300 0s200 40 300 0 150-30 200-10" fill="none" stroke="#1a6fa0" strokeWidth="6" />
      <path d="M0 140c100-40 200-40 300 0s200 40 300 0 150-30 200-10" fill="none" stroke="#3d7ca3" strokeWidth="4" />
      <circle cx="450" cy="58" r="14" fill="#f5b335" />
    </svg>
  );
}
