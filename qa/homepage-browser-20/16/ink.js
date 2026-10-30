'use strict';
// Still composition: native links and the source disclosure need no custom state.
Promise.resolve(document.fonts ? document.fonts.ready : undefined).then(() => {
  document.documentElement.dataset.browserStudyReady = '16';
});
