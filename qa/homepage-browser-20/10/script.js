'use strict';
// Readiness signals the static study and its local fonts. No remote data work.
document.fonts.ready.then(() => {
  document.documentElement.dataset.browserStudyReady = '10';
});
