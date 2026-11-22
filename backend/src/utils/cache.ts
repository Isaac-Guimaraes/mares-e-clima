interface Entrada<T> {
  valor: T;
  expiraEm: number;
}

/**
 * Cache em memória com tempo de vida (RNF01).
 * Suficiente para um processo único; para várias instâncias, trocar por Redis.
 */
export class CacheMemoria<T> {
  private readonly entradas = new Map<string, Entrada<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly limiteEntradas = 500,
    private readonly agora: () => number = Date.now,
  ) {}

  obter(chave: string): T | undefined {
    const entrada = this.entradas.get(chave);
    if (!entrada) return undefined;
    if (entrada.expiraEm <= this.agora()) {
      this.entradas.delete(chave);
      return undefined;
    }
    return entrada.valor;
  }

  salvar(chave: string, valor: T): void {
    if (this.entradas.size >= this.limiteEntradas) {
      // Remove a entrada mais antiga (Map preserva a ordem de inserção).
      const maisAntiga = this.entradas.keys().next().value;
      if (maisAntiga !== undefined) this.entradas.delete(maisAntiga);
    }
    this.entradas.set(chave, { valor, expiraEm: this.agora() + this.ttlMs });
  }

  /** Retorna do cache ou executa `produzir` e guarda o resultado. */
  async obterOuProduzir(chave: string, produzir: () => Promise<T>): Promise<T> {
    const existente = this.obter(chave);
    if (existente !== undefined) return existente;
    const valor = await produzir();
    this.salvar(chave, valor);
    return valor;
  }
}
