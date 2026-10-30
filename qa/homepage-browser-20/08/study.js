'use strict';
// Readiness is a capture hook only; essential content is rendered in the HTML.
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => { document.documentElement.dataset.browserStudyReady = '08'; });
