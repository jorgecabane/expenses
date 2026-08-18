// Agrupa gastos por comercio para la pantalla de Aprendizaje.
//
// Refleja stableKey() de bank-sync (src/dedup.ts), que es la fuente de verdad: allá
// esta clave decide la deduplicación y una diferencia rompe la importación. Acá sólo
// agrupa para mostrar y sugerir, así que una diferencia menor no rompe nada.
const LARGO_COMERCIO = 12

export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/\s+/g, ' ').trim()
}

/** El banco publica el comercio truncado (~15 chars) y lo completa después: cortar a 12 hace que ambas versiones caigan en el mismo grupo. */
export function merchantKey(description: string): string {
  const i = description.indexOf(' - ')
  const merchant = i < 0 ? description : description.slice(i + 3)
  return normalizeText(merchant).slice(0, LARGO_COMERCIO)
}
