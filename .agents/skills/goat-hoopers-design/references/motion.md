# Motion and rendering review

Load only for transition, ticker or optional-3D work. Read DESIGN.md's asset and
motion budgets, including the active-game exception. Its rules own the product
constraints; this reference supplies conditional timing and lifecycle detail.

## Choose the motion's job

Identify the changed state and why motion helps a person perceive it. Focus
and price inspection respond immediately; numeric prices are never tweened.
Keep essential text, data and controls visible before any observer runs.
Scroll-driven reveals are not a default treatment for this site.

The existing `--gh-cs-duration` is 180ms. Suggested extensions, **not shipped
tokens or measured acceptance results**, are:

| Job | Suggested duration | Review question |
| --- | --- | --- |
| Button/control feedback | 120ms | Does the response remain immediate during repeated input? |
| State transition | 180ms | Does it clarify the change without delaying use? |
| Overlay entry / exit | 220ms / 120ms | Are opening, Close, Escape and focus restoration reliable during interruption? |

Extend shared timing roles only when the scoped implementation needs them.
Prefer existing CSS/installed primitives; no new animation framework. At most
one authored basketball moment should earn attention on a surface. Preserve
the approved still treatment when motion would compete with reading or data.

## Follow the lifecycle, not just the first frame

Inspect live `prefers-reduced-motion` changes, page visibility, intersection
visibility and optional `navigator.connection?.saveData`. Reduced motion stops
nonessential movement; it must retain navigation, inspection and readable
state. Save-Data is an optional capability, not a prerequisite for functionality.
Decide whether a still/poster is sufficient before downloading decorative 3D.

Still 3D renders on load, resize or manual inspection. Verify **zero decorative
RAF while idle, offscreen, hidden or under reduced motion**; manual input may
request a still frame. Keep lazy loading, authored pose, fallback, manual
inspection and resource disposal. Exercise open → inspect → close → reopen,
preference changes during use, context loss and failed loading. Check observer,
timer, renderer, GPU and decoded-image cleanup without removing approved assets.
Active free-throw gameplay follows its separate owner contract.

For the ticker, a persistent Pause/Resume control stops both scrolling and mode
rotation and remains effective after focus or hover leaves. Test keyboard and
touch activation, paused mode changes and live reduced-motion changes. A static
state must retain readable content and useful destination access; no offscreen
or hidden duplicate track should keep decorative work alive. Distinguish CSS
animation, mode timers and renderer frames when recording evidence.

## Source-study attribution

- [pbakaus/animate](https://www.ui-skills.com/skills/pbakaus/animate): motion that explains a state change.
- [emilkowalski/animate](https://www.ui-skills.com/skills/emilkowalski/animate): restrained timing and interruptible interactions.
- [animation-on-scroll](https://www.ui-skills.com/skills/mengto/animation-on-scroll): evaluate visibility/lifecycle costs; reject hidden-reveal snippets for essential content.
- [accessible-animation](https://www.ui-skills.com/skills/iart-ai/accessible-animation): persistent control, live preference response and static alternatives.
