if (new URLSearchParams(location.search).get('stage') === 'structure') {
  document.documentElement.dataset.stage = 'structure';
}
const sourceLabel = document.querySelector('.source-label');
sourceLabel.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sourceLabel.open) {
    sourceLabel.open = false;
    sourceLabel.querySelector('summary').focus();
  }
});
document.fonts.ready.then(() => {
  document.documentElement.dataset.browserStudyReady = '09';
});
