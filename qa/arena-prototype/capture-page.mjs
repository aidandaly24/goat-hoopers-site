import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

sharp.cache(false);
sharp.concurrency(1);
const settle = tab => tab.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const inventory = tab => tab.locator("[data-courtside-home]").evaluate(root => JSON.stringify({
  text: root.textContent, links: [...root.querySelectorAll("a")].map(link => [link.textContent, link.getAttribute("href")]),
  fields: [...root.querySelectorAll("input,select,button,summary")].map(element => [element.tagName, element.getAttribute("type"), element.getAttribute("aria-label"), element.textContent]),
}));

/** A tall native Chromium capture wraps at this software renderer's 8192px
 * texture limit. Capture only bounded viewports, then stitch exact document
 * offsets. Capture-only CSS makes the sticky header static without changing
 * its in-flow size; animation/caret suppression changes no content or handler. */
export async function capturePage(tab, output, { checkpoints = false } = {}) {
  const before = await inventory(tab);
  const originalScroll = await tab.evaluate(() => scrollY);
  const style = await tab.addStyleTag({ content: `
    [data-site-chrome] { position: relative !important; top: auto !important; }
    *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    html { scroll-behavior: auto !important; }
  ` });
  try {
    await tab.evaluate(async () => {
      await document.fonts.ready;
      const images = [...document.images];
      for (const image of images) image.loading = "eager";
      await Promise.allSettled(images.map(image => image.decode()));
      getSelection()?.removeAllRanges();
    });
    await settle(tab); await tab.waitForTimeout(250);
    const viewport = tab.viewportSize();
    const height = await tab.evaluate(() => document.documentElement.scrollHeight);
    const layout = await tab.evaluate(() => ({
      headings: [...document.querySelectorAll("h1,h2")].filter(element => element.getClientRects().length).map(element => ({ text: element.textContent.trim(), y: Math.round(element.getBoundingClientRect().top + scrollY) })),
      footer: { text: document.querySelector("footer").textContent.trim(), y: Math.floor(document.querySelector("footer").getBoundingClientRect().top + scrollY) },
      teams: document.querySelectorAll("[data-team-id]").length,
      rosterReferences: new Set([...document.querySelectorAll("[data-team-id] a[href^='/player/']")].map(link => link.getAttribute("href"))).size,
      maxTextureSize: (() => { const gl = document.querySelector(".arena-world canvas")?.getContext("webgl2"); return gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? null; })(),
    }));
    assert.equal(layout.teams, 10); assert.equal(layout.rosterReferences, 228);
    assert(layout.footer.y < height);
    const tiles = [], composites = [];
    let cursor = 0;
    while (cursor < height) {
      await tab.evaluate(y => scrollTo({ top: y, behavior: "instant" }), Math.min(cursor, height - viewport.height));
      await settle(tab); await tab.waitForTimeout(70);
      assert.equal(await tab.evaluate(() => document.documentElement.scrollHeight), height, "Page height changed during capture");
      const scroll = await tab.evaluate(() => scrollY);
      const cropTop = cursor - scroll, take = Math.min(viewport.height - cropTop, height - cursor);
      assert(cropTop >= 0 && take > 0);
      const shot = await tab.screenshot({ fullPage: false, animations: "disabled", caret: "hide", scale: "css" });
      const meta = await sharp(shot).metadata();
      assert.equal(meta.width, viewport.width); assert.equal(meta.height, viewport.height);
      const strip = await sharp(shot).extract({ left: 0, top: cropTop, width: viewport.width, height: take }).png().toBuffer();
      composites.push({ input: strip, left: 0, top: cursor });
      tiles.push({ documentY: cursor, scrollY: scroll, cropTop, height: take });
      cursor += take;
    }
    assert.equal(cursor, height);
    const png = await sharp({ create: { width: viewport.width, height, channels: 3, background: "white" } }).composite(composites).png().toBuffer();
    await mkdir(dirname(output), { recursive: true });
    let bytes = png, quality = null;
    if (/\.jpe?g$/i.test(output)) {
      let low = 35, high = 95;
      while (low <= high) {
        const trial = Math.floor((low + high) / 2);
        const encoded = await sharp(png).jpeg({ quality: trial, progressive: true, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
        if (encoded.length < 890000) { bytes = encoded; quality = trial; low = trial + 1; } else high = trial - 1;
      }
      assert(quality !== null && bytes.length < 900000, "JPEG exceeded the review tool's budget");
    }
    await writeFile(output, bytes);
    const prefix = output.slice(0, -extname(output).length);
    if (extname(output) !== ".png") await writeFile(`${prefix}.png`, png);
    const proof = [];
    if (checkpoints) {
      const checkpointY = [0, tiles[Math.floor(tiles.length / 2)].documentY, Math.max(0, height - viewport.height)];
      const contact = [];
      const contactWidth = Math.min(720, viewport.width);
      let contactHeight = 0;
      for (const [index, name] of ["top", "middle", "bottom"].entries()) {
        await tab.evaluate(y => scrollTo({ top: y, behavior: "instant" }), checkpointY[index]);
        await settle(tab); await tab.waitForTimeout(70);
        const scroll = await tab.evaluate(() => scrollY);
        const independent = await tab.screenshot({ fullPage: false, animations: "disabled", caret: "hide", scale: "css" });
        const fromPage = await sharp(png).extract({ left: 0, top: scroll, width: viewport.width, height: viewport.height }).removeAlpha().raw().toBuffer();
        const fromViewport = await sharp(independent).removeAlpha().raw().toBuffer();
        await writeFile(`${prefix}-${name}.png`, independent);
        let differing = 0, absoluteError = 0, maxChannelError = 0;
        for (let i = 0; i < fromPage.length; i += 3) {
          let changed = false;
          for (let channel = 0; channel < 3; channel++) {
            const delta = Math.abs(fromPage[i + channel] - fromViewport[i + channel]);
            changed ||= delta > 0; absoluteError += delta; maxChannelError = Math.max(maxChannelError, delta);
          }
          if (changed) differing++;
        }
        // Chromium can rerasterize fractional-position text after scrolling.
        // Bound that sparse antialias noise; a wrapped or missing region fails.
        const differingRatio = differing / (viewport.width * viewport.height);
        const meanChannelError = absoluteError / fromPage.length;
        assert(differingRatio <= .001 && meanChannelError <= .02, `${name} viewport mismatch: ${differing} pixels, mean channel error ${meanChannelError}`);
        const thumb = await sharp(independent).resize({ width: contactWidth }).png().toBuffer();
        const thumbMeta = await sharp(thumb).metadata(); contactHeight = thumbMeta.height;
        contact.push({ input: thumb, left: index * contactWidth, top: 0 });
        proof.push({ name, documentY: scroll, width: viewport.width, height: viewport.height, differingPixels: differing,
          differingRatio, meanChannelError, maxChannelError, tolerance: "at least 99.9% exact pixels; mean channel error <= 0.02/255; sparse text rasterization only" });
      }
      await sharp({ create: { width: contactWidth * 3, height: contactHeight, channels: 3, background: "white" } })
        .composite(contact).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toFile(`${prefix}-checkpoints.jpg`);
    }
    assert.equal(await inventory(tab), before, "Capture changed page content, links or controls");
    const evidence = { method: "bounded viewport PNG tiles; integer document offsets; no native fullPage capture", viewport,
      width: viewport.width, height, bytes: bytes.length, jpegQuality: quality, tiles, checkpoints: proof, ...layout,
      inventorySha256: createHash("sha256").update(before).digest("hex"), captureOnlyStyle: "sticky header static; animation and caret suppressed", contentPreserved: true };
    await writeFile(`${prefix}-capture.json`, JSON.stringify(evidence, null, 2) + "\n");
    return evidence;
  } finally {
    await style.evaluate(element => element.remove());
    await tab.evaluate(y => scrollTo({ top: y, behavior: "instant" }), originalScroll);
  }
}
