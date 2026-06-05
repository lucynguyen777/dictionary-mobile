import {
  getBilingualCoverageInventoryRows,
  getFutureSourceGateRows,
  getLanguageCoverageInventoryRows,
  getLanguageCoverageSummary,
} from '../data/languageCoverageInventory';

function yn(value: boolean) {
  return value ? 'yes' : 'no';
}

const summary = getLanguageCoverageSummary();

console.log(`# Language Coverage Inventory\n`);
console.log(
  `Summary: ${summary.registeredLanguages} registered languages, ${summary.productionParity} production parity rows, ${summary.monolingualPreview} monolingual previews, ${summary.sourceGated} source-gated rows, ${summary.localEntryTotal} local fixture entries.\n`
);

console.log('| Code | Label | Status | Source | Entries | Definitions | Examples | Related | Morphology | Adapter | Tests | Top gap | Next action |');
console.log('| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |');
for (const row of getLanguageCoverageInventoryRows()) {
  console.log(
    `| ${row.code} | ${row.label} | ${row.status} | ${row.sourceKind} | ${row.localEntryCount} | ${row.definitionCount} | ${row.exampleCount} | ${row.relatedWordCount} | ${yn(row.hasMorphology)} | ${yn(row.hasRegisteredAdapter)} | ${row.testLevel} | ${row.topGap} | ${row.nextAction} |`
  );
}

console.log('\n## Bilingual Pairs\n');
console.log('| Pair | Label | Status | Source | Top gap | Next action |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const row of getBilingualCoverageInventoryRows()) {
  console.log(`| ${row.pair} | ${row.label} | ${row.status} | ${row.sourceKind} | ${row.topGap} | ${row.nextAction} |`);
}

console.log('\n## Future Source Gates\n');
console.log('| Code | Label | Status | Top gap | Next action |');
console.log('| --- | --- | --- | --- | --- |');
for (const row of getFutureSourceGateRows()) {
  console.log(`| ${row.code} | ${row.label} | ${row.status} | ${row.topGap} | ${row.nextAction} |`);
}
