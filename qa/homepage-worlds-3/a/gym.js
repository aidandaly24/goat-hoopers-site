if (new URLSearchParams(window.location.search).get('stage') === 'structure') {
  document.documentElement.dataset.stage = 'structure';
}
document.documentElement.dataset.worldReady = 'a';
