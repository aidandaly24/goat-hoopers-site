# Root wireframe QA, before independent gate

First sources/captures stay preserved; these are not final acceptance.

-01: root390×844, html font-size200%!important, body32px: document428px in member/public across states. Owner report did not catch this exact root test. Narrow text correction required before full implementation acceptance.
-03: after selecting standings, an absolutely positioned visually hidden table header is not contained by a positioned table/chapter. Document grows to1187px member/407px public at390, persists into later chapters. Live local CSS probe `.standing-table{position:relative}` reduced width to390; source unchanged pending preserved-source QA correction. Actual navigation/state checks must be repeated after correction.
-04: root inspected complete member phone and native desktop program pixels. Desktop source indices04/06 wrap each digit in the narrow slate; prevent two-digit wrapping in later bounded QA. No conceptual acceptance inferred.
-02/04/06:10/10 root mechanical state/viewport cases pass, not AT/physical-device or structural acceptance.
