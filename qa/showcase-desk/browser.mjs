import assert from 'node:assert/strict';

/** Run against the existing private home-fidelity Next fixture.
 * The saved environment supplies the browser and its read-only network guard. */
export async function verifyShowcaseDesk(page, { origin, mode = 'fixed', source = 'unrecorded' }) {
  const base = new URL(origin);
  assert.equal(base.hostname, '127.0.0.1', 'Use the private synthetic fixture only');
  assert.ok(['baseline', 'fixed'].includes(mode));
  const records = [], errors = [], writes = [];
  const onError = error => errors.push(String(error));
  const onRequest = request => { if (request.method() !== 'GET') writes.push(request.url()); };
  page.on('pageerror', onError);
  page.on('request', onRequest);
  const measure = node => {
    const box = rect => ({ left: rect.left, right: rect.right, width: rect.width, height: rect.height });
    const rect = node.getBoundingClientRect();
    const children = [...node.children].map(child => {
      const range = document.createRange();
      range.selectNodeContents(child);
      return { text: child.textContent.trim(), tag: child.tagName, rect: box(child.getBoundingClientRect()),
        textRects: [...range.getClientRects()].filter(r => r.width > 0).map(box) };
    });
    const outside = children.flatMap(child => child.textRects).filter(r => r.left < rect.left - 1 || r.right > rect.right + 1 || r.left < -1 || r.right > innerWidth + 1);
    return { bar: box(rect), clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
      pageScrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      wrap: getComputedStyle(node).flexWrap, overflowX: getComputedStyle(node).overflowX,
      children, outside: outside.length };
  };
  const focus = async link => {
    await page.keyboard.press('Tab');
    await link.focus();
    const state = await link.evaluate(node => ({
      active: node === document.activeElement,
      outlineWidth: parseFloat(getComputedStyle(node).outlineWidth),
      outlineStyle: getComputedStyle(node).outlineStyle,
      width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
    }));
    assert.ok(state.active && state.outlineWidth >= 2 && state.outlineStyle !== 'none', 'Keyboard focus must remain visible');
    assert.ok(state.width >= 44 && state.height >= 44, 'Link target must remain at least44px');
    return state;
  };
  try {
    for (const width of [320, 390, 1440]) for (const text of [100, 200]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const state of ['showcase-public', 'showcase']) {
        const url = new URL('/', base); url.searchParams.set('state', state);
        await page.goto(url.href);
        await page.waitForFunction(() => document.documentElement.dataset.reviewHydrated === 'true');
        await page.evaluate(({ text, theme }) => {
          document.documentElement.style.fontSize = text + '%';
          document.documentElement.dataset.theme = theme;
        }, { text, theme });
        await page.evaluate(() => document.fonts.ready.then(() => true));
        const isPublic = state === 'showcase-public';
        const desk = page.locator(isPublic ? '[data-league-desk]' : '[data-team-desk]');
        const link = desk.getByRole('link', { name: isPublic ? 'Explore this week' : 'My team', exact: true });
        const bar = isPublic ? link.locator('..') : desk.getByRole('navigation', { name: 'Your team', exact: true });
        const metrics = await bar.evaluate(measure);
        if (isPublic) {
          assert.deepEqual(metrics.children.map(child => child.text), ['Explore this week', 'All five matchups'], 'Keep both full labels');
          if (mode === 'fixed') {
            assert.equal(metrics.outside, 0, 'Desk text must remain within bar and viewport');
            assert.ok(metrics.scrollWidth <= metrics.clientWidth + 1, 'Desk must not overflow its own box');
            assert.ok(!['hidden', 'clip'].includes(metrics.overflowX), 'Do not hide overflowing content');
          }
        } else {
          assert.equal(await link.getAttribute('href'), '/team');
          assert.match(await bar.getByRole('link', { name: 'View roster', exact: true }).getAttribute('href'), /^\/teams\/[^/#]+#team-roster$/);
          assert.equal(metrics.outside, 0, 'Member action geometry must remain bounded');
          for (const action of await bar.getByRole('link').all()) await focus(action);
        }
        const keyboard = await focus(link);
        let navigation = null;
        if (isPublic) {
          const token = 'showcase-document-' + records.length;
          await page.evaluate(value => { window.__showcaseDeskDocument = value; }, token);
          await page.keyboard.press('Enter');
          await page.waitForFunction(() => location.hash === '#ai-decides');
          assert.equal(await page.locator('#ai-decides').count(), 1, 'Keep the real in-page destination');
          assert.equal(await page.evaluate(() => window.__showcaseDeskDocument), token, 'In-page link must retain the document');
          navigation = { hash: new URL(page.url()).hash, targetPresent: true, sameDocument: true };
        }
        records.push({ width, text, theme, state, metrics, keyboard, navigation });
      }
    }
    assert.deepEqual(errors, [], 'No page errors');
    assert.deepEqual(writes, [], 'No write requests');
    const reproduced = records.filter(row => row.state === 'showcase-public' && row.width === 320 && row.text === 200 && row.metrics.outside > 0);
    if (mode === 'baseline') assert.ok(reproduced.length > 0, 'Reproduce the original signed-out320px/200% defect before accepting a fix');
    return { source, mode, records, baselineOverflowCases: reproduced.length, errors, writes,
      wholePageOverflow: 'Recorded separately; unrelated230/directory overflow is not claimed fixed' };
  } finally {
    page.off('pageerror', onError);
    page.off('request', onRequest);
  }
}

export function compareShowcaseDesk(before, after) {
  assert.equal(before.mode, 'baseline'); assert.equal(after.mode, 'fixed');
  assert.ok(before.baselineOverflowCases > 0);
  assert.equal(after.baselineOverflowCases, 0);
  assert.equal(before.records.length, after.records.length);
  for (const current of after.records) {
    const old = before.records.find(row => ['width','text','theme','state'].every(key => row[key] === current[key]));
    assert.ok(old);
    // Member rules and desktop rules are untouched. Compare their rectangles,
    // rather than asserting the whole page has no unrelated pre-existing issue.
    if (current.state === 'showcase' || current.width === 1440) {
      for (const key of ['left','right','width','height']) assert.ok(Math.abs(old.metrics.bar[key] - current.metrics.bar[key]) <= 1, 'Unchanged desk geometry: ' + key);
      assert.deepEqual(old.metrics.children.map(c => c.text), current.metrics.children.map(c => c.text));
    }
  }
  return { cases: after.records.length, signedOutOverflowResolved: true, memberAndDesktopGeometryPreserved: true };
}
