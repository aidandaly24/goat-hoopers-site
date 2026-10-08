# Issue 65 mounted-browser fixture

Run from the repository root (locked dependencies only):

```sh
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL node_modules/.bin/vite src/test/stock-inspector
```

Open http://127.0.0.1:8815 in the supported existing browser. The real
StockBoard/StockInspector and CSS mount within the production `.exchange`
ancestor, with three synthetic quotes and the injected `loadDetail` seam.
Ready details deliberately exceed phone height.
Profile links lead to a local synthetic profile; no Next app/data loader runs.

- Reset between cases to clear the per-board cache and request count.
- At 1025px, rows use the compact layout. Check the 1040px/1041px row breakpoint
  and desktop alignment at 1440px, with vertical scrollbars present. The empty
  action header must reserve the same width as Price history / Full profile.
  Check 320px and 390px compact rows too. **Measure alignment and bounds** reports
  viewport/content width, actual VALUE / CHANGE / IN LEAGUE boundary differences,
  and maximum overflow. Bounds check page/board scroll width, visible cells and
  buttons/links against each grid's padded content box, and overflowing cell
  contents. Alignment and bounds report separately with a 0.5px tolerance;
  aligned grids must not hide clipping. Repeat after resizing/opening tall detail.
  Compact rows still check bounds; desktop alignment reports not applicable.
- Choose Pending/Error before opening a quote; Escape from the focused
  inspector heading/Close/Retry/profile link should dismiss and restore focus.
- Resolve/reject pending after closing: the inspector must stay closed.
  Reopen resolved detail: the request count must stay unchanged.
- Choose Ready after Error, activate Retry with Enter/Space, then Escape.
- Activate Close with Enter/Space; traverse controls with Tab/Shift+Tab,
  including out of the nonmodal inspector. Other keys must not dismiss.
- Escape on Outside inspector or the empty desktop inspector must leave
  selection/focus unchanged. Descendant Escape controls simulate prevented
  and stopped events; both preserve selection. Consumed Escape does not
  increment the outer bubble counter.
- Remove triggers while a quote is selected, then Escape: focus should return
  to The player board. At 320/390px widths, verify heading and restored trigger
  rectangles are visible after closing the tall panel.

The unit tests exercise the returned React event handler; they do not establish
native DOM bubbling, focus, browser key activation, or responsive visibility.
Record mounted-browser evidence separately.
