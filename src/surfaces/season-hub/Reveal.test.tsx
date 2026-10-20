import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ node: null as unknown, cleanup: undefined as undefined | (() => void) }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useRef: () => ({ current: harness.node }),
  useEffect: (effect: () => void | (() => void)) => { harness.cleanup = effect() || undefined; },
}));
import { Reveal } from './Reveal';
import styles from './Reveal.module.css';

describe('one-shot visible homepage entrance', () => {
  let node: EventTarget & { classList: Set<string> & { remove: (name: string) => void } };
  let media: EventTarget & { matches: boolean };
  let documentState: EventTarget & { hidden: boolean };
  let intersect: (entries: { isIntersecting: boolean }[]) => void;
  const disconnect = vi.fn(), observe = vi.fn();

  beforeEach(() => {
    disconnect.mockClear(); observe.mockClear(); harness.cleanup = undefined;
    const classes = new Set<string>();
    node = Object.assign(new EventTarget(), { classList: Object.assign(classes, { remove: (name: string) => { classes.delete(name); } }) });
    harness.node = node;
    media = Object.assign(new EventTarget(), { matches: false });
    documentState = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal('document', documentState);
    vi.stubGlobal('window', { matchMedia: () => media, IntersectionObserver: true });
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof intersect, options: IntersectionObserverInit) { intersect = callback; expect(options.threshold).toBe(0); }
      disconnect = disconnect; observe = observe;
    });
  });
  afterEach(() => { harness.cleanup?.(); vi.unstubAllGlobals(); });

  it('never hides waiting content and starts once for any intersection', () => {
    Reveal({ children: 'Visible content' });
    expect(node.classList.size).toBe(0);
    intersect([{ isIntersecting: false }]); expect(node.classList.size).toBe(0);
    intersect([{ isIntersecting: true }]); expect(node.classList.has(styles.in)).toBe(true);
    expect(disconnect).toHaveBeenCalledOnce();
    node.dispatchEvent(new Event('animationend'));
    expect(node.classList.size).toBe(0);
  });
  it('skips observation when initially reduced or hidden', () => {
    media.matches = true; Reveal({ children: 'Visible' });
    media.matches = false; documentState.hidden = true; Reveal({ children: 'Visible' });
    expect(observe).not.toHaveBeenCalled(); expect(node.classList.size).toBe(0);
  });
  it('cancels immediately when reduced motion changes, without restarting', () => {
    Reveal({ children: 'Visible' }); intersect([{ isIntersecting: true }]);
    media.matches = true; media.dispatchEvent(new Event('change'));
    expect(node.classList.size).toBe(0);
    media.matches = false; media.dispatchEvent(new Event('change'));
    intersect([{ isIntersecting: true }]);
    expect(node.classList.size).toBe(0);
    expect(observe).toHaveBeenCalledOnce();
  });
  it('cancels when hidden and removes observers on unmount', () => {
    Reveal({ children: 'Visible' });
    documentState.hidden = true; documentState.dispatchEvent(new Event('visibilitychange'));
    expect(disconnect).toHaveBeenCalledOnce(); expect(node.classList.size).toBe(0);
    harness.cleanup?.(); expect(disconnect).toHaveBeenCalledTimes(2);
  });
});
