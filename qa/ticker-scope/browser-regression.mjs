import assert from 'node:assert/strict';

/** Use the review environment's existing Playwright page; no browser install.
 * The origin must be this private synthetic fixture, never the live site. */
export async function verifyUnmatchedNavigation(page, origin) {
  const base = new URL(origin);
  assert.equal(base.hostname, '127.0.0.1');
  const missing = new URL('/fixture-unmatched-missing/nested', base).href;
  const home = new URL('/', base).href;
  const marker = `ticker-document-${Date.now()}`;
  const checks = [];
  await page.setExtraHTTPHeaders({
    'x-ticker-probe': 'browser-unmatched-regression',
    'x-ticker-fixture-case': 'full',
  });

  const primary = page.locator('[data-ticker-primary="/"]');
  const notFound = page.getByRole('heading', { name: 'TICKER_FIXTURE_NOT_FOUND', exact: true });
  const assertDocument = async () => assert.equal(
    await page.evaluate(() => window.__goatTickerNavigationDocument), marker,
    'Link/Back/Forward must preserve the same document; a hard navigation can hide this regression',
  );
  const assertMissing = async (step) => {
    await page.waitForURL(missing);
    await notFound.waitFor({ state: 'visible' });
    assert.equal(await primary.count(), 0, `${step}: previous home page retained`);
    await assertDocument();
    checks.push({ step, url: page.url(), notFound: true, retainedHome: false, sameDocument: true });
  };

  await page.goto(home);
  await page.waitForSelector('[data-ticker-fixture-hydrated="true"]', { state: 'attached' });
  assert.equal(await primary.count(), 1);
  await page.evaluate((value) => { window.__goatTickerNavigationDocument = value; }, marker);

  // A real Next Link, after hydration. A raw HTTP/Flight request cannot cover it.
  await page.getByRole('link', { name: 'Unmatched route regression', exact: true }).click();
  await assertMissing('Link to unknown URL');

  await page.goBack();
  await page.waitForURL(home);
  await primary.waitFor({ state: 'visible' });
  await page.waitForSelector('[data-ticker-fixture-hydrated="true"]', { state: 'attached' });
  assert.equal(await notFound.count(), 0);
  await assertDocument();
  checks.push({ step: 'Back to home', url: page.url(), home: true, sameDocument: true });

  await page.goForward();
  await assertMissing('Forward to unknown URL');

  const response = await page.reload();
  await notFound.waitFor({ state: 'visible' });
  assert.equal(await primary.count(), 0, 'Reload must also show not-found');
  assert.notEqual(await page.evaluate(() => window.__goatTickerNavigationDocument), marker);
  // Next permits HTTP200 for streamed not-found boundaries; CI separately
  // asserts non-streamed bot HTML404 and the Flight404 control signal.
  assert.ok(response && [200, 404].includes(response.status()));
  assert.ok(await page.locator('meta[name="robots"][content*="noindex"]').count());
  checks.push({ step: 'Reload unknown URL', url: page.url(), notFound: true, status: response.status(), newDocument: true });
  return { checks, requests: 'private fixture only', productionWrites: 'none' };
}
