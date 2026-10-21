/** Explicit synthetic fixtures; no provider, database, account or score writes. */
import {cache} from 'react';
import {headers} from 'next/headers';
import {personalizedFixture,playerGuideFixture} from '@/test/personalized-home-fixture';
import {buildRealNewsFeed,OUTLETS,parseRssItems} from '@/data/real-news';
import type {Transaction} from '@/domain';

export const fixture=cache(async()=>{
  const h=await headers(),raw=personalizedFixture();
  const timestamp=Date.parse(h.get('x-qa-date')??'2026-10-20T02:30:00Z');
  const move:Transaction={id:'synthetic-portis-add',type:'free_agent',week:1,createdAt:timestamp,summary:'Fixture Club 4 added Bobby Portis',teamIds:['4'],adds:[{playerId:'synthetic-portis',name:'Bobby Portis'}],drops:[]};
  raw.home.hub!.transactions=[move];raw.home.directory[3].latestMove=move;
  raw.home.directory[0].players[0].fullName='Alperen Şengün';
  const searchId=raw.home.directory[0].players[0].id;
  const quote=raw.market.stocks.find(s=>s.playerId===searchId)!;
  quote.playerName='Alperen Şengün';quote.price=76.54;
  const mode=h.get('x-qa-summary')??'null';
  const description=mode==='missing'?'':`<description><![CDATA[<p>${mode==='legitimate'?'Bobby Portis scored 20 points.':'null'}</p>]]></description>`;
  const xml=`<rss><channel><item><title>Synthetic lead headline</title><link>https://www.espn.com/nba/story/_/id/qa-lead</link><pubDate>Tue, 20 Oct 2026 03:00:00 GMT</pubDate>${description}</item><item><title>Synthetic row headline</title><link>https://www.espn.com/nba/story/_/id/qa-row</link><description>The deal was declared null and void.</description><pubDate>Tue, 20 Oct 2026 02:00:00 GMT</pubDate></item></channel></rss>`;
  const articles=buildRealNewsFeed(parseRssItems(xml).map(item=>({item,outlet:OUTLETS.espn})),{players:[],rosteredPlayerIds:new Set(),rookiePlayerIds:new Set(),rostersKnown:true,draftKnown:true});
  if(mode==='cached-null')articles[0].summary='null';
  return{...raw,move,guide:playerGuideFixture('1'),news:{builtAt:Date.now(),coverage:{rosters:'ok' as const,directory:'ok' as const,draft:'ok' as const},articles}};
});
