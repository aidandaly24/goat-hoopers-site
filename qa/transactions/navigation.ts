// Vite adapter only. The separate Next fixture uses the installed real hooks.
import {useSyncExternalStore} from 'react';
const original=history.pushState.bind(history);
history.pushState=(...args)=>{original(...args);dispatchEvent(new Event('fixture-url'));};
const subscribe=(notify:()=>void)=>{
  addEventListener('popstate',notify);addEventListener('fixture-url',notify);
  return()=>{removeEventListener('popstate',notify);removeEventListener('fixture-url',notify);};
};
export function useSearchParams(){
  const query=useSyncExternalStore(subscribe,()=>location.search,()=> '');
  return new URLSearchParams(query);
}
