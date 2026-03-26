/**
 * Determina a região cooperativa com base nos DDDs reais das filiais.
 * Qualquer DDD não listado explicitamente é direcionado randomicamente
 * para uma das cooperativas de Goiânia.
 */

export interface Regiao {
  slug: string;
  coop: number;
  name: string;
  tag: number;
}

export function getRegionByDDD({
  phoneNumber,
}: {
  uf?: string;
  phoneNumber?: string;
}): Regiao {
  // Cooperativas de Goiânia para distribuição randomizada
  const goianiaCoops = [1317, 11339, 16383];

  // Seleciona uma cooperativa aleatória de Goiânia
  const randomGoianiaCoop =
    goianiaCoops[Math.floor(Math.random() * goianiaCoops.length)];

  const regions: Regiao[] = [
    { slug: "goiania",    coop: randomGoianiaCoop, name: "Goiânia",     tag: 18718 },
    { slug: "cuiaba",     coop: 8046,              name: "Cuiabá",      tag: 15899 },
    { slug: "arapiraca",  coop: 8941,              name: "Arapiraca",   tag: 15898 },
    { slug: "joaoPessoa", coop: 12193,             name: "João Pessoa", tag: 15900 },
  ];

  const dddByRegion: Record<string, number[]> = {
    cuiaba:     [65, 66, 67],
    arapiraca:  [82, 79, 71, 73, 74, 75, 77],
    joaoPessoa: [83, 84],
  };

  // Remove máscara para garantir que pegamos os números reais do DDD
  const digits = phoneNumber?.replace(/\D/g, "") ?? "";

  if (digits.length >= 2) {
    const ddd = parseInt(digits.slice(0, 2), 10);

    for (const [slug, ddds] of Object.entries(dddByRegion)) {
      if (ddds.includes(ddd)) {
        return regions.find((r) => r.slug === slug) ?? regions[0];
      }
    }
  }

  // Fallback: retorna Goiânia com cooperativa randomizada
  return regions[0];
}

/** Retorna sempre a região Goiânia (usada como fallback no retry do CRM) */
export function getGoianiaRegion(): Regiao {
  return getRegionByDDD({ phoneNumber: "62" });
}
