import json
from pathlib import Path
base=Path('qa/homepage-structures');out=base/'reviews'
shape={
'01':'01 is a continuous almanac with open score prose, marginal value and anchored inline foldouts',
'02':'02 uses six court positions to choose a persistent adjacent field-note reader',
'03':'03 pages horizontally between independently scrolling chapters with a fixed Previous/select/Next footer',
'04':'04 selects a program from a source rail while retaining a separate five-game score rail',
'05':'05 drills from a spatial typographic fact field into replacement working layers with origin/Zoom out return',
'06':'06 filters a single dated event spine with a persistent team brief',
'07':'07 places scoreboard, searchable locker doors, bench leaves and archive shelf in an illustrated room',
'08':'08 mirrors two teams across a measure spine with comparison/player/form views',
'09':'09 lets independently opened disclosure branches coexist beside the current junction',
'10':'10 edits two player packages from a quote shelf while retaining selected evidence in a separate working tray',
'11':'11 searches players, clubs and tasks, opening answers directly below a result',
'12':'12 retains a central pairing, peripheral team satellites and a third pinned comparison team',
'13':'13 opens one unequal folio spread from a visible folded spine map, with adjacent-fold and Fold book controls',
'14':'14 runs four unequal independently scrolling channels with explicit related-passage returns',
'15':'15 selects source periods and opens evidence against calendar lanes',
'16':'16 lets the user add, reorder and pin independent league materials in a retained canvas',
'17':'17 searches and sorts a league ledger with aligned fields and attached row readers',
'18':'18 pins player identities across a field/source-period matrix and follows their team evidence',
'19':'19 searches an alphabetic franchise yearbook, opening a club dossier in flow or a separate league notebook',
'20':'20 follows natural-language intent choices through one selected ancestry path beside the matchup origin'}
visual={
'01':'white ground, generous Lora prose and red reading links', '02':'cobalt court linework, cyan route trace and condensed sport headings',
'03':'navy/orange programme, tall condensed score typography and a pale saved-decision sheet','04':'black source slate, royal-blue broadcast slugs, white program and narrow dense score rail',
'05':'lemon full field, giant Anton facts and pink returned percentage','06':'pale green continuous wire, restrained sans type and a white date spine',
'07':'brown illustrated floor/wall, cream paper leaves, serif room headings and small locker portraits','08':'dark gold/blue mirrored planes, condensed team names and monochrome player cutouts',
'09':'pale blue branch stems, small monospaced facts and open disclosure prose','10':'dark green quote shelf, pale green package tray and compact financial rows',
'11':'lavender search canvas, broad sans query line and sparse result rows','12':'near-black constellation, thin cyan connections, small portraits and technical display lettering',
'13':'navy/gold binding, serif small-cap spines and white unequal reading leaves','14':'continuous citron/white/steel/ink channel grounds and emphatic sans stream heads',
'15':'sky-blue field, white date matrix and large plain date numerals','16':'dark green canvas, large full-color franchise cutouts, arena image and orange arrangement control',
'17':'black/white ledger, compact monospaced records and red sheet/focus accents','18':'cream comparison table with teal measure labels and peach/lavender identity columns',
'19':'navy yearbook, giant cream condensed club names, gold standings and isolated full-color cutouts','20':'plum open tree, large DM Sans questions, pink endpoints and turquoise pixel score accents'}
phone={
'01':'continuous single-column reading with collapsed contents and inline roster disclosures', '02':'a vertical court before the inline note reader and Back to court return',
'03':'one scrolling chapter selected by a bottom picker and arrows', '04':'a source chooser and sticky selected-score strip above one program',
'05':'staggered facts in an independently scrolling canvas, then the selected working layer', '06':'a dated feed with filters and a team brief above it',
'07':'the score wall followed by the locker/bench room with contextual jumps', '08':'both score columns retained, then a side selector and a measure/read chooser',
'09':'stacked coexisting branches with a Branches index', '10':'the active trade tray first, with quote/evidence navigation and a fixed package summary',
'11':'the search input, result categories and attached inline answers', '12':'connection-first context and jumps among home, away and the optional pinned team',
'13':'the binding edge, fold map, adjacent spread controls and one open leaf', '14':'an explicit Team/League/Scout/Culture selector preserving four reader positions',
'15':'a selected-period agenda with Calendar toggle', '16':'one-width kept materials retaining the user’s arrangement and edit controls',
'17':'a Sheet selector, Fields selector and labelled ledger records', '18':'field-first records under pinned identity headers, preserving source periods',
'19':'search/initial/order, large club entries and a bottom Teams/Find player/Notebook/My team bar', '20':'a compact origin followed by a continuous selected intent path with parent/index controls'}
related={
('01','13'):'Both are book-like reading systems. 01 exposes a continuous document and inline margins; 13 has a real folded index, one expanded spread and explicit neighbouring-fold navigation.',
('02','04'):'Both retain navigation beside a selected reader. 02 maps six positions geometrically on a court; 04 has a source rail plus an additional independently meaningful five-game score rail and selected-game program.',
('02','07'):'Both use a spatial league metaphor. 02 is a six-position navigation map feeding one note reader; 07 is a scrollable room with actual locker disclosures, bench leaves and an archive shelf coexisting.',
('03','14'):'Both preserve multiple substantial readers. 03 makes them sequential horizontal chapters behind a fixed pager; 14 exposes four unequal vertical readers concurrently and uses explicit cross-channel returns.',
('07','16'):'Both keep several league contexts in a spatial canvas. 07 assigns fixed room roles to score wall, lockers, bench and archive; 16 gives the user add, reorder, pin and remove operations over independent materials.',
('08','10'):'Both put two sets of evidence in comparison. 08 mirrors clubs along shared measure rows; 10 has an asymmetric quote shelf feeding editable Package A/B lists and retained source notes.',
('09','11'):'Both open useful detail at its reading origin. 09 retains an explicit tree of independently open evidence branches; 11 makes query/category ranking and task-result answers the primary navigation.',
('09','14'):'Both let evidence coexist. 09 uses disclosure ancestry in an ordinary flowing document; 14 has four fixed topic channels with their own scroll positions and departure/return controls.',
('09','20'):'Both use actual branches. 09 permits multiple open sibling branches in parallel; 20 chooses one path through intent questions, keeps its ancestors and provides an explicit parent return.',
('10','16'):'Both retain user-selected material. 10 constrains it to two quote packages with totals plus evidence; 16 edits the homepage composition itself through kept item order, pinning and additional materials.',
('11','19'):'Both search entities and open in-flow detail. 11 starts from a universal player/team/task query and compact results; 19 begins with alphabetic franchise identity, very large club entries and a separate multi-topic notebook.',
('13','19'):'Both use a publication metaphor with league and club material. 13 is a folding topic atlas with spines and unequal spreads; 19 is an alphabetic franchise field with attached dossiers and a separate notebook.',
('14','16'):'Both retain parallel context, but 14 fixes four semantic independently scrolling dispatches while 16 allows selection, ordering and pinning of heterogeneous materials in a page canvas.',
('15','17'):'Both use a working matrix. 15 columns are supplied source periods and rows are dated evidence lanes; 17 rows are franchises/matchups with sortable aligned data fields and attached detail readers.',
('17','19'):'Both are searchable, sortable league-wide entity indexes with origin-attached detail. 17 prioritizes comparable table fields; 19 prioritizes franchise identity and large portrait/name entries, with broader evidence in its notebook.'}
some={('01','13'),('03','08'),('03','14'),('04','19'),('05','19'),('06','11'),('06','14'),('06','17'),('07','13'),('07','16'),('08','10'),('08','16'),('08','19'),('09','11'),('09','14'),('09','17'),('10','16'),('13','19'),('15','17'),('16','19'),('17','19')}
records=[]
for p in json.load(open(out/'assignment-3.json')):
 a,b=p['a'],p['b'];k=(a,b);structure=related.get(k,f'{shape[a]}; {shape[b]}. Their navigation, context retention and main geometry differ.')
 records.append({'idA':a,'idB':b,'structuralVerdict':'R' if k in related else 'D','visualSimilarity':'some' if k in some else 'low','reason':structure+' Visually: '+visual[a]+' versus '+visual[b]+'.','phoneNote':f'{a} keeps {phone[a]}; {b} keeps {phone[b]}. The phone task and navigation models remain materially different.'})
(out/'pairs-art-c.json').write_text(json.dumps(records,indent=2)+'\n')
print('wrote',len(records),'pair observations before benchmark comparison')
