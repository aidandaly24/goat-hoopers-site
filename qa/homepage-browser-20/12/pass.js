(() => {
  if (new URLSearchParams(window.location.search).get('stage') === 'structure') {
    document.documentElement.dataset.stage = 'structure';
  }
  document.fonts.ready.then(() => {
    document.documentElement.dataset.browserStudyReady = '12';
  });
})();
