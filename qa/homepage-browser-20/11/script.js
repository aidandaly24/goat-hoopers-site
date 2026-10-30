const select = document.querySelector('#club-sort');
const body = document.querySelector('#club-rows');
const rows = Array.from(body.rows);
select.addEventListener('change', () => {
  const mode = select.value;
  const sorted = [...rows].sort((a, b) => mode === 'name'
    ? a.dataset.name.localeCompare(b.dataset.name)
    : Number(a.dataset[mode]) - Number(b.dataset[mode]));
  body.append(...sorted);
  document.querySelector('#sort-result').textContent = `All 10 clubs · ${select.selectedOptions[0].textContent.toLowerCase()}`;
});
document.fonts.ready.then(() => { document.documentElement.dataset.browserStudyReady = '11'; });
