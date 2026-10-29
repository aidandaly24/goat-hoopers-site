# Bounded final-corrections review — B

Theme 07’s phone badge wrapping and theme 09’s face metadata/price spacing are visibly corrected in the inspected rework captures. I found no collateral clipping or loss of the programme/playground theme systems in the regions and full-page compositions reviewed. No additional correction is requested from this bounded visual inspection. This is not formal approval, a new artistic selection, or a change to the original pair judgments.

Both corrected four-state capture sets were present before closure, and root confirmed that 07 was fully ready. No pending capture outcome is treated as complete.

## Observed corrections

**07 — phone two-digit badges.** I compared native-width strips of every post-hero section heading in the original and rework member and public phone images. The previously stacked digits now sit side by side: member notebook/book/AI/register/table markers and public market/AI/register/table markers remain two-digit horizontal badges. The public club-register marker reads `06` on one line. Hero `01`/`03`, the green/yellow programme bands, slab-serif headings, framed arena, register cards, table, archive and footer retain their visual roles. Desktop page heights are unchanged; member/public phone heights shorten by 10/7 px respectively.

**09 — face metadata and price spacing.** I inspected the entire native-width corrected face grid in all four states, rather than relying on the partial standard middle crops. Each of the ten entries keeps its position/modelled-value metadata separate from its price link. The original desktop run-ons such as `top modeled value$137.50 FAAB` are replaced by distinct metadata and price lines. The phone grids contain all ten entries, including wrapped Shai Gilgeous-Alexander and Giannis Antetokounmpo names, without collision with price rows or adjacent entries. Circular portraits, the green face panel, illustrated court island, rounded colour pods, pill controls, roster rows, archive and curved footer remain intact. The extra vertical room is local to the face panel: desktop pages grow by 95 px and phone pages by 38 px in both modes.

**Composition and clipping check.** I compared all four complete original/rework pages per theme at overview scale and opened corrected native top/middle/bottom cuts in every state. The section sequence and full-page rhythm remain recognisable, controls in the sampled native regions remain contained, and the inspected footer/archives are present. Cuts that start or end within a component are viewport crop boundaries, not evidence of content being clipped by the page. I saw no new clipping in the reviewed regions.

## Current-source and capture checks

- SHA-256 recomputation matches all six `sourceFiles` entries in the two rework capture manifests; the HTML hash also matches each manifest’s `htmlSha256` value.
- For all eight corrected states, the standalone `*-capture.json` payload equals the corresponding capture record fields in its manifest. JPEG dimensions and byte counts match those records.
- The capture records report viewport-width scroll widths, ten teams, ten faces, five saved pairs, 228 roster references, empty browser-error/remote-request lists and `contentPreserved: true`; personal regions are recorded as four for member and zero for public. These are recorded capture facts, not newly executed interaction tests.
- `rework-07-verification.json` and `rework-09-verification.json` each contain ten passing cases with `passed: 10`, `total: 10`. The recorded cases cover member/public normal, 320 px, root-font enlargement, stale and missing states. I read the completed results; I did not independently rerun those browser cases.

The root verification JSON files do not contain their own source-hash binding. Their 10/10 results are supporting recorded audit evidence, kept separate from my current-source/manifest checks and direct pixel findings. Exact source, capture and metadata hashes below bind this review to the files actually inspected.

## Inspection limits

Complete pages were viewed at overview scale because they are very tall. Native top/middle/bottom cuts were viewed at 1440 px desktop and 390 px phone width. Additional face-grid crops retain native width; badge comparisons retain 390 px per original/rework column. These additional views were made in memory from the listed full-page JPEGs and displayed as WebP derivatives; no extra image file was written.

This is sampled visual QA, not a native-resolution audit of every intervening pixel. I did not visually inspect separate 320 px or enlarged-text screenshots, test interaction/keyboard/focus/hover/open disclosures, verify live data or routes/authentication, use assistive technology, or test a physical device. The root’s recorded tests are not claimed as my own. I read no design rationale or other critic report for this correction review and made no source edit.

## Reproducible additional views

| Purpose | Source image | Native crop |
| --- | --- | --- |
| 07 member badge comparison | `07-member-phone.jpg` and `rework-07-member-phone.jpg` | Each post-hero heading’s recorded `y − 15`, height 80 px, full 390 px width; originals left and corrected right. |
| 07 public badge comparison | `07-public-phone.jpg` and `rework-07-public-phone.jpg` | Same method for every post-hero heading. |
| 09 original member desktop faces | `09-member-desktop.jpg` | x 0–1440, y 4712–5445. |
| 09 corrected member desktop faces | `rework-09-member-desktop.jpg` | x 0–1440, y 4712–5540. |
| 09 original public desktop faces | `09-public-desktop.jpg` | x 0–1440, y 4080–4813. |
| 09 corrected public desktop faces | `rework-09-public-desktop.jpg` | x 0–1440, y 4080–4908. |
| 09 corrected member phone faces | `rework-09-member-phone.jpg` | x 0–390, y 8610–10149. |
| 09 corrected public phone faces | `rework-09-public-phone.jpg` | x 0–390, y 7351–8890. |

Coordinates come from each capture’s heading inventory: 40 px above `Faces of the league` to 20 px above `The clubhouse`.

## Current source SHA-256

Every row below was recomputed and matches its manifest’s recorded hash.

```text
5fce1d64ff8e2ee84b66311b8b735284b1140978474eed19e283c5c384f1efb9  qa/homepage-themes/rework/07/index.html
79a5d14f8a2bc1fdf6d41ed9c8d0bb30145b3f9929bea8b4d2b09183e7d7924a  qa/homepage-themes/rework/07/varsity.css
e355cf5790a3bfe68bbf961126d5f5b975778c26b5696cc9b9dcf8e816923e22  qa/homepage-themes/rework/07/varsity.js
9ba2d0c846ebd1bf9ecf834384d0f7c48bdba2830dea19053bc4b3c6989aac3e  qa/homepage-themes/rework/09/index.html
bf2082705c44f4bee8c0c2c8000997c60962934326fc4a6e2a69bb8ba7b247be  qa/homepage-themes/rework/09/playground.css
4c5b5216118ed8e397aabf0ad0085f03027fe7ba59beac6a239954a4c8a9d168  qa/homepage-themes/rework/09/playground.js
```

## Exact viewed image files and SHA-256

All paths are relative to the worktree. The list contains eight original full pages, eight corrected full pages and 24 corrected native top/middle/bottom cuts. Full pages also supply the additional in-memory regions described above.

```text
26f8112d98e849c112f8635279c66982d46abefa2d15a18a260d9968d2583488  qa/homepage-themes/evidence/07-member-desktop.jpg  [1440x9866]
caad660b88098dd66be1cf0fd953c5ad1197d44a7274093446cb4bb4b4c142d9  qa/homepage-themes/evidence/07-member-phone.jpg  [390x17359]
bb0ea7a7abb8fea02d19667814f366b6b6d0150329b7292cad26897580cc4bee  qa/homepage-themes/evidence/07-public-desktop.jpg  [1440x8728]
d18985f82f9ff6182dc58eee7e0a926489540ffecf2b68bd1a14a17bb8f40c84  qa/homepage-themes/evidence/07-public-phone.jpg  [390x15590]
570cc03e07ae4800fc1b40d07df75a7b290d538580b409aa2417beb1f8ea399d  qa/homepage-themes/evidence/09-member-desktop.jpg  [1440x9999]
8b9d42a142140bf81227273f2cb04cae6e0098cc06edb5f0bc2ea25e0a70541d  qa/homepage-themes/evidence/09-member-phone.jpg  [390x17992]
429167e2693664de7aff7ac2e3cf81e6ac5d1863a5a7bc9a225ff4c34bc06ba6  qa/homepage-themes/evidence/09-public-desktop.jpg  [1440x9367]
3bdcc41afe89ec40cac0b1379a95a52fd561290f9abb9c53917c9100ef4c4e90  qa/homepage-themes/evidence/09-public-phone.jpg  [390x16755]
4339966f48474871580c978f1c8bc30a5bfadec9983052f29621196c5dc40b75  qa/homepage-themes/evidence/rework-07-member-desktop-bottom.jpg  [1440x1000]
c718eb72d4ef1f67d45a43eab454bd413e731df86e24ac94161b36e92f122c9a  qa/homepage-themes/evidence/rework-07-member-desktop-middle.jpg  [1440x1000]
dd01a5185a50aabe97ed777a30c59f3e344f42c067ca9af89041d260de7a14b8  qa/homepage-themes/evidence/rework-07-member-desktop-top.jpg  [1440x1000]
a453e1b46efa931d31c4f4053d2f9e42bd587ff6b5181fad8be75ebd16be7807  qa/homepage-themes/evidence/rework-07-member-desktop.jpg  [1440x9866]
73e9b32fe5fe909c61775a6067e41cf167f662e7b259277e3522ad5f861d996e  qa/homepage-themes/evidence/rework-07-member-phone-bottom.jpg  [390x844]
7f2b22b0849fc035506eb9d12e76267ba109f3ebdfec30dbe71c2ab9d68246dc  qa/homepage-themes/evidence/rework-07-member-phone-middle.jpg  [390x844]
da1b051193b433b6e18332aaee6909c031a1beefd279f2df7e6f5aac4e9b5524  qa/homepage-themes/evidence/rework-07-member-phone-top.jpg  [390x844]
d1d14ed47601750af55344c67ed42c8cecb2c62f69c3a057f18a05597468f5b1  qa/homepage-themes/evidence/rework-07-member-phone.jpg  [390x17349]
267e73b3356dc3b27bc4b92274cc1f89954c95cf90eb4d1cfac5a328adc8cbe1  qa/homepage-themes/evidence/rework-07-public-desktop-bottom.jpg  [1440x1000]
999c8041c9d1d5ee138f3c42cbd35ac565b6657caff4352354d4ee657a421740  qa/homepage-themes/evidence/rework-07-public-desktop-middle.jpg  [1440x1000]
6ba3b44a866d695cb2e2b8965c68946799e4e48964014d6d1b74466a68e902ca  qa/homepage-themes/evidence/rework-07-public-desktop-top.jpg  [1440x1000]
033ba50609e17e6322b240e198d88470f34cc016d69b6f6a21a0f571f0439765  qa/homepage-themes/evidence/rework-07-public-desktop.jpg  [1440x8728]
a58f25f54d6ba6fa21fcd24ab920f8823b554de7b2eac977e618048f5a1a034d  qa/homepage-themes/evidence/rework-07-public-phone-bottom.jpg  [390x844]
dc5ffbcc14c34a2b78cc2e1744a91664f7b8074b53fd96bed07fa33aaa9b6794  qa/homepage-themes/evidence/rework-07-public-phone-middle.jpg  [390x844]
59b9de312de33b7699d52f6255c1b17026ef86316f6b4dd0707aa79e89083a1e  qa/homepage-themes/evidence/rework-07-public-phone-top.jpg  [390x844]
2ef92eff080da2295a0ad4551ec7f636ae030f01020c072d18877f1ad7de28de  qa/homepage-themes/evidence/rework-07-public-phone.jpg  [390x15583]
d164556dd1be99227c74ba7bbcf47f5254abbc68fd15e08bcdd627e8a7836d54  qa/homepage-themes/evidence/rework-09-member-desktop-bottom.jpg  [1440x1000]
02cd97a82ac59e9eee6dd15449fc41a06d70c21b92afb15aa606e4713c7aa001  qa/homepage-themes/evidence/rework-09-member-desktop-middle.jpg  [1440x1000]
546090c53bad7a4240daf315603b963adec8451b7ab91a410ea433ea9e828ecd  qa/homepage-themes/evidence/rework-09-member-desktop-top.jpg  [1440x1000]
67deda89342de96092b57eddbe1d43fb076c31b5f9c4d90360d78efe090eea56  qa/homepage-themes/evidence/rework-09-member-desktop.jpg  [1440x10094]
720776e269b2eb6eb096b4d40ee234e78650e39eb04657136729b8b5281a83cf  qa/homepage-themes/evidence/rework-09-member-phone-bottom.jpg  [390x844]
a105037d79716eadc798e81aeef70060d2caa4374073aa74afd26d2f7a998f23  qa/homepage-themes/evidence/rework-09-member-phone-middle.jpg  [390x844]
2641f3e71d4a421fc8a0140eecaf78083b1f1dad0ef3f0209e9d69d5acf7940a  qa/homepage-themes/evidence/rework-09-member-phone-top.jpg  [390x844]
747302b330c37f47c7a041df9b1bc6a8c98324c10411a4be0d80d2584c80e337  qa/homepage-themes/evidence/rework-09-member-phone.jpg  [390x18030]
d997232fa4380e29af553294d4c7a50443a3f89393291e5683da180cbced2483  qa/homepage-themes/evidence/rework-09-public-desktop-bottom.jpg  [1440x1000]
a319e9e9cb9cbc46e34e98fd2f6c646261e395ecc3a522321f048e7d44778e0d  qa/homepage-themes/evidence/rework-09-public-desktop-middle.jpg  [1440x1000]
1e37859930851f6732c9f7fa07f6d1b1370a7475232988a1e9e89ba4edb39346  qa/homepage-themes/evidence/rework-09-public-desktop-top.jpg  [1440x1000]
f371dc92d5ea7d5ebcbae359d8425ca15de5c74f1825c185a0a9d42af6d2cb28  qa/homepage-themes/evidence/rework-09-public-desktop.jpg  [1440x9462]
817d26ce97136c86fcdbdb422ca26819ad9ad991a6bbe76764d77603c0f3cb26  qa/homepage-themes/evidence/rework-09-public-phone-bottom.jpg  [390x844]
1d3e046a7aa85cc2c2ed276d9b7f6004ce17f1a470c77f79385f5147b2b996d4  qa/homepage-themes/evidence/rework-09-public-phone-middle.jpg  [390x844]
ad40a90782d233861a765e47633bba3c51e3a3ea01b81e5070d9eb724b2d66bd  qa/homepage-themes/evidence/rework-09-public-phone-top.jpg  [390x844]
88699f4966d3a8c88907d93056b3b40bc9b8cac24560c9d648de303cb9791416  qa/homepage-themes/evidence/rework-09-public-phone.jpg  [390x16793]
```

## Metadata files read and SHA-256

Original `07-captures.json` and `09-captures.json` were also read for original heading positions and page-height comparisons. The following corrected manifests, per-state records and root verification files were read and hashed.

```text
4af33fc17e5736c67170c707e2dbdc2a67e34cb80f89381ed6d315151c7285a1  qa/homepage-themes/evidence/rework-07-member-desktop-capture.json
2690b30d943ec7e10aa18aaa3995200dc18c3fa0532b635124661aa45858e19a  qa/homepage-themes/evidence/rework-07-member-phone-capture.json
f07aacd7188a5c1579bc27ea7fc4d6c7421cc6b1a53c18f7fc1503bf2c659737  qa/homepage-themes/evidence/rework-07-public-desktop-capture.json
7b22b4573abfeef92f7bf91fc2e6b0e80ae42c9595c8ed8de6e14e3795b29a2e  qa/homepage-themes/evidence/rework-07-public-phone-capture.json
0497875416b85f010c5cb91b19e933665fe9a7772403be9ffc0447dde8518ec3  qa/homepage-themes/evidence/rework-07-captures.json
dd037356abe659b28e3351cf9311265c28269e6ffc9fff9c407bd04a4708f72a  qa/homepage-themes/evidence/rework-07-verification.json
b8ac95bfb5ae63933be9eb66066ff347ceea41ac51a6bd4518b50c65975230c3  qa/homepage-themes/evidence/rework-09-member-desktop-capture.json
21aeaafcc55f8ca7fbf0a5c20424e6492cb4208bbfe2929542a3e22d995b1312  qa/homepage-themes/evidence/rework-09-member-phone-capture.json
35b62ef7ca53a5a4d9a90dfa553f4afce975c89639f0e7112aed6047fbd24045  qa/homepage-themes/evidence/rework-09-public-desktop-capture.json
349000dace9754df87bd123e1a3671793b989008950f117eb7d9929888a1e2c2  qa/homepage-themes/evidence/rework-09-public-phone-capture.json
31e576dd81b22f5716ae483812ee86aea96c22699272f6b855170e75c64254f8  qa/homepage-themes/evidence/rework-09-captures.json
1caa50c6a21e3403aeedda0e3238d7f2bb89a4efdd3df145e617b53e5d6cc3a5  qa/homepage-themes/evidence/rework-09-verification.json
```
