from pathlib import Path
import json
root=Path('qa/homepage-structures/reviews')
arch={
'01':'one continuous almanac with contents anchors, an open score sentence and marginal member evidence',
'02':'six spatial court positions that replace a separate field-note reader',
'03':'a horizontally paged chapter deck, independently scrolling chapter bodies and fixed previous/select/next navigation',
'04':'a section rail, replaceable central program and persistent all-game score rail',
'05':'a free-positioned fact wall whose individual words enter nested zoom layers and return to their origin',
'06':'a dated vertical wire with category/period filters and an alternate team register',
'07':'a room of concurrent score wall, locker doors, roster bench, archive shelf and game crate',
'08':'mirrored home/away metric rows around a narrow central label spine, with comparison subviews',
'09':'a continuously branching document where multiple model, member and archive disclosures remain open together',
'10':'a searchable quote shelf feeding two persistent editable trade packages and retained evidence notes',
'11':'a search front door with filtered task/entity result rows that expand answers in place',
'12':'linked club panels around a central matchup, with independently chosen roster/value contexts and an optional third club',
'13':'a fold book with one open spread, unequal chapter spines and explicit previous/next/fold controls',
'14':'four simultaneous, independently scrolling editorial/action channels with targeted cross-links',
'15':'a date-column planner with source-period selection and an agenda attached to the chosen event',
'16':'a retained-material canvas whose franchise, matchup and evidence pieces can be added, moved, pinned or removed',
'17':'a category-switched league ledger with sortable team rows and attached roster/evidence subrows',
'18':'a pinned-name evidence matrix whose rows distinguish field and source period, plus transcript and source register',
'19':'an alphabetic franchise yearbook with in-flow team dossiers and a separate league notebook',
'20':'a task-choice tree that retains its matchup origin and ancestor path as the selected evidence branch changes'}
art={
'01':'large Lora serif reading, sparse open rules and grayscale editorial portraits',
'02':'condensed Oswald headings, monospaced scores, a drawn court and a plain light reader',
'03':'narrow Barlow display type, large score fields, strong flat page blocks and occasional color portraits',
'04':'condensed score/program typography, dense light utility readers and flat black/white blocks',
'05':'extremely heavy condensed facts, sparse asymmetric spacing and words used as the dominant imagery',
'06':'quiet sans headings, medium-density prose and a dated spine, with faces confined to the register',
'07':'serif room/station titles, portrait-bearing lockers, perspective wall geometry and paper-like reading leaves',
'08':'large condensed team names, mirrored score typography and grayscale cutout player anchors',
'09':'fine connector stems, airy sans prose, monospaced large values and nested open-text branches',
'10':'dense sans source rows, monospaced prices and visibly operative add/move/remove controls',
'11':'large sans search language, widely spaced action rows and very little imagery',
'12':'square technological display type, restrained body text, circular portraits and connector geometry',
'13':'small-cap-like serif chapter titles, broad sans interior headings and high-contrast facing leaves',
'14':'heavy broad headings, dense sans editorial copy and unequal edge-to-edge channel widths',
'15':'clean sans labels, large dates, fine calendar rules and substantive empty/gap cells',
'16':'large condensed headings, spacious unboxed material, a wide arena image and full-color player cutouts',
'17':'monospaced records, broad heavy headings, thin table rules and small grayscale identity images',
'18':'quiet sans typography, large field values, colored identity columns and almost no initial imagery',
'19':'oversized uppercase condensed franchise names, generous whitespace and large full-color anchor portraits',
'20':'large plain sans task choices, fine branching stems and small pixel-type logo/known-score accents'}
phone={
'01':'contents folds while the continuous reading order and individually stacked score sides remain',
'02':'a complete vertical court precedes the chosen inline reader; selection brings the reader into view',
'03':'the chapter picker and arrows remain fixed while the active chapter scrolls internally',
'04':'section select and compact five-game disclosure retain the game while the central source changes',
'05':'the wall keeps asymmetric two-column facts and nested zoom/return rather than becoming a card feed',
'06':'the date spine and filters remain, with the member sidebar integrated into the first dated entry',
'07':'room jumps and a compact matchup guide precede sequential stations and their independent rolls',
'08':'both score sides stay visible, while Your/Opponent controls choose the detailed side',
'09':'the same nested branches flow vertically and the Branches index recalls retained evidence',
'10':'the two-package tray appears first, totals stay at the bottom and quote/notebook work remains reachable',
'11':'search and category/order controls remain first and answers expand beneath their result rows',
'12':'the relationship/score appears first, followed by separate linked club contexts and A/B/C jumps',
'13':'the active fold stacks its leaves and the closed book exposes all chapter spines',
'14':'Team/League/Scout/Culture choices show one channel while preserving independent channel state',
'15':'a purpose-built Agenda/Calendar choice defaults to the selected source period’s agenda',
'16':'retained pieces become an ordered vertical composition with the same add/arrange/pin controls',
'17':'a Sheet selector and Fields selector expose labelled team records rather than a squeezed wide table',
'18':'the matrix transposes into field groups with repeated pinned names and a text-transcript alternative',
'19':'initial/order selects, compact portrait entries and bottom Teams/Notebook/My team navigation remain',
'20':'a compact matchup summary precedes the vertical decision path, with parent Back and Branch index'}
related={'01-03','01-09','03-04','03-13','03-19','04-09','04-12','06-09','08-12','08-18','09-13','09-16','10-18','12-16','12-19','13-15','16-18','17-18'}
some={'01-03','01-09','02-03','02-09','02-12','03-04','03-13','03-16','03-19','04-09','04-12','04-15','04-18','06-10','06-16','07-12','08-12','09-10','09-13','09-16','10-15','10-18','11-15','11-18','12-13','12-16','12-19','13-15','13-18','14-15','14-18','15-16'}
custom={
'01-03':'Both are publication-oriented readers, but01 retains the whole reading canvas and03 makes chapter selection the unit of navigation; this is a substantive difference even where the same fixture prose recurs.',
'01-09':'Both permit inline reading, but09 makes branch retention and multiple open routes explicit, whereas01 stays a linear almanac with marginal context and anchor contents.',
'03-04':'Both feel like game programs, but04 keeps an all-game rail beside every central source;03 swaps the entire active chapter and uses a fixed chapter deck. Neither is merely a palette replacement of the other.',
'03-13':'The book/program family is evident.03 changes a horizontal chapter and its own scroll;13 folds a spread into a visible chapter spine and can show a closed-book index. The spread geometry and return model differ.',
'03-19':'Both use tall sports-publication display type, yet19 organizes ownership by alphabet and team dossiers;03 organizes weekly reading by chapters and saved-pick context.',
'04-09':'Both preserve current context while reading evidence, but04 does so in a separate score rail;09 retains open branches in the same long document. The navigation units and geometry are different.',
'04-12':'Both preserve team/game context beside selected evidence.04 keeps a fixed rail around one replaceable source;12 lets each linked club carry its own context and adds a third entity.',
'08-12':'This is the closest paired-comparison family in this assignment.08 aligns two metric fields around labels;12 separates club dossiers from their connection and supports a third club. Their phone controls preserve this difference.',
'08-18':'Both compare named entities, but08 begins with a sports matchup and side-specific metric views;18 compares heterogeneous evidence by field and period, with pin/remove and transcript operations.',
'09-13':'Both use local expansion, but09 keeps multiple branches open concurrently;13 treats one open spread and the remaining spines as the book’s navigation. Matching prose alone does not erase this difference.',
'09-16':'Both retain evidence, but09 retains native document branches;16 retains independent material pieces that users can add, reorder and pin. Editable composition is a real interaction change.',
'10-18':'Both are working comparison tools.10 changes package membership and arithmetic from a quote shelf;18 changes pinned entities and compares units/periods in a field matrix. The phone result is not the same generic list.',
'12-16':'Both keep multiple club contexts, but12 positions them by their relationship to a matchup;16 exposes user-owned placement/order and independent material types. The shared portrait fixtures are not duplicate architecture.',
'12-19':'Both foreground league ownership, but12 is a relationship workspace with simultaneous contexts;19 is an alphabetic ownership index that opens a dossier in flow.',
'13-15':'Both offer book-like dated reading, but13 folds named spreads while15 selects a source period and attaches an agenda to a calendar event. The calendar’s gaps and date cells are substantive.',
'16-18':'Both allow users to choose compared material.16 edits a composition of heterogeneous pieces;18 retains up to three named columns inside a consistent evidence matrix. Their control contracts differ.',
'17-18':'Both belong to a tabular evidence family.17 is an all-league row ledger with attached readers;18 pins selected names as columns and organizes rows by field/period. Phone field selection versus field-group transposition is substantive.'}
items=[]
for pair in json.loads((root/'assignment-2.json').read_text()):
 a,b=pair['a'],pair['b'];k=a+'-'+b
 base=custom.get(k,f'{a} uses {arch[a]}; {b} uses {arch[b]}. These change the entry point, retained context and actual navigation geometry.')
 reason=base+' Visually, '+a+' uses '+art[a]+'; '+b+' uses '+art[b]+'.'
 items.append({'idA':a,'idB':b,'structuralVerdict':'R' if k in related else 'D','visualSimilarity':'some' if k in some else 'low','reason':reason,'phoneNote':a+': '+phone[a]+'. '+b+': '+phone[b]+'. The distinction survives390px; shared fixture text is not treated as a duplicate.','evidence':[f'art-b-evidence/{a}-1440-first.png',f'art-b-evidence/{a}-390-first.png',f'art-b-evidence/{b}-1440-first.png',f'art-b-evidence/{b}-390-first.png',f'art-b-evidence/{a}-walk.json',f'art-b-evidence/{b}-walk.json']})
assert len(items)==63 and len({(x['idA'],x['idB']) for x in items})==63
(root/'pairs-art-b.json').write_text(json.dumps(items,indent=2,ensure_ascii=False)+'\n')
print('Wrote',len(items),'assigned pair assessments; unassigned pairs not rated.')
