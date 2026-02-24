import { NextResponse } from 'next/server';

const script = `
(function(){
  var BASE = '${process.env.NEXT_PUBLIC_APP_URL || ''}';
  document.querySelectorAll('a[href]').forEach(function(el){
    el.addEventListener('click',function(e){
      var href=el.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('javascript'))return;
      e.preventDefault();
      fetch(BASE+'/api/script/verify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:href})
      }).then(function(r){return r.json()}).then(function(d){
        window.location.href=d.rescueUrl||href;
      }).catch(function(){window.location.href=href});
    });
  });
})();
`.trim();

export async function GET() {
  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
