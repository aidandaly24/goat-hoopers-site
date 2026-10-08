/* Native review controls only. No app data fetching or production writes. */
(() => {
  'use strict';
  const frame = document.getElementById('preview');
  const width = document.getElementById('width');
  const labels = { chalk: 'Chalk + clay', slate: 'Paper + slate', linen: 'Linen + burgundy' };
  function apply() {
    const choice = document.querySelector('input[name="palette"]:checked').value;
    if (frame.contentDocument?.documentElement) frame.contentDocument.documentElement.dataset.treatment = choice;
    frame.style.width = width.value + 'px';
    const size = width.value === '1440' ? '1440px desktop' : width.value + 'px phone';
    frame.title = `Current GOAT Hoopers Courtside component layout · ${labels[choice]} · ${size}`;
    document.getElementById('selection').textContent = `${labels[choice]} · ${size} · proposed, not selected`;
  }
  document.getElementById('palette').addEventListener('change', apply);
  width.addEventListener('change', apply);
  frame.addEventListener('load', apply);
})();
