const markReady = () => { document.documentElement.dataset.worldReady = 'c'; };
if (document.fonts && document.fonts.ready) document.fonts.ready.then(markReady, markReady);
else markReady();
