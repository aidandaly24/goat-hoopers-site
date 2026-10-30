'use strict';
// The trajectory follows the real, flowing content; it does not position the content.
const page = document.querySelector('.whole-shot');
const flight = document.querySelector('.flight');
const paths = flight.querySelectorAll('path');
function drawShot() {
  const frame = page.getBoundingClientRect();
  const release = document.querySelector('.portrait-circle').getBoundingClientRect();
  const ball = document.querySelector('.ball').getBoundingClientRect();
  const hoop = document.querySelector('.hoop').getBoundingClientRect();
  const ox = release.left - frame.left + 18;
  const oy = release.top - frame.top + 15;
  const bx = ball.left - frame.left + ball.width / 2;
  const by = ball.top - frame.top + ball.height / 2;
  const rx = hoop.left - frame.left + hoop.width / 2;
  const ry = hoop.top - frame.top + hoop.height * 65 / 150;
  flight.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
  const shape = (inset) => `M ${ox+inset} ${oy} C ${ox-110+inset} 450, ${ox-60+inset} 55, ${frame.width*.32} 55 C ${frame.width*.32+160} 55, ${bx-90} ${by-55}, ${bx} ${by} C ${bx+180} ${by+100}, ${rx-inset} ${ry-250}, ${rx-inset} ${ry}`;
  paths[0].setAttribute('d', shape(0));
  paths[1].setAttribute('d', shape(31));
}
document.fonts.ready.then(() => {
  drawShot();
  new ResizeObserver(drawShot).observe(page);
  document.documentElement.dataset.browserStudyReady = '18';
});
