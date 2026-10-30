const parameters = new URLSearchParams(window.location.search);
if (parameters.get('stage') === 'structure') {
  document.documentElement.dataset.stage = 'structure';
}
document.fonts.ready.then(() => {
  document.documentElement.dataset.browserStudyReady = '05';
});
