// Rows for the Word "Conjugation" tab (docs/etymology-conjugation-integration-plan.md). Live rows
// come from the Wiktionary inflection table of the looked-up entry and carry one attribution for
// the whole table; rows from the bundled sample entries are labelled as samples.
import type { ApiAttributedForm } from './dictionaryApi';

export type ConjugationRow = { form: string; tense: string };

// Wiktextract bookkeeping rows, not forms a learner should see.
const NON_FORM_TAGS = new Set(['inflection-template', 'table-tags', 'class', 'romanization']);

export function getLiveConjugation(forms: ApiAttributedForm[] | undefined): { attribution: string; rows: ConjugationRow[] } | null {
  const seen = new Set<string>();
  const rows: ConjugationRow[] = [];
  for (const row of forms ?? []) {
    if (row.features.some((feature) => NON_FORM_TAGS.has(feature))) continue;
    const tense = row.features.length ? row.features.join(' · ') : 'Form';
    const key = `${tense}\u0000${row.form}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ form: row.form, tense });
  }
  return rows.length ? { attribution: forms![0].attribution, rows } : null;
}
