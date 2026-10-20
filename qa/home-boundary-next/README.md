# Homepage server/client boundary regression

Run `node qa/home-boundary-next/verify.mjs` after installing the locked dependencies.
The runner creates a temporary Next.js project, builds the actual homepage
components, and checks production HTML and RSC responses for public, synthetic
member, missing-edition and archived states. It supplies no credentials and
blocks external server fetches. Its generated files never enter the app checkout.

Passing another checkout as the first argument tests that source tree instead.
Against PR207's merge commit this reproduces the production `openingPhase`
server-to-client call failure; after the extraction it must render all eight
responses successfully. This exercises the real framework boundary that Vite
and ordinary React static rendering do not enforce.
