import threading, http.server, functools, pathlib, json
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).parent.resolve()
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8780),functools.partial(Q,directory=str(ROOT)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
AXE=(ROOT/"node_modules/axe-core/axe.min.js").read_text()
JS=r"""() => { const f=[]; const de=document.documentElement;
 if (de.scrollWidth > innerWidth) f.push('horizontal overflow '+de.scrollWidth);
 const trunc=[...document.querySelectorAll('*')].filter(e=>{const cs=getComputedStyle(e); return cs.textOverflow==='ellipsis' && e.scrollWidth>e.clientWidth+1 && e.offsetParent}).map(e=>e.textContent.trim().slice(0,40));
 if (trunc.length) f.push('truncated: '+trunc.join(' | '));
 const small=[...document.querySelectorAll('a,button,input,select,textarea')].filter(e=>e.offsetParent && !e.classList.contains('card-hit')).map(e=>{const r=e.getBoundingClientRect(); return [e.getAttribute('aria-label')||e.textContent.trim()||e.placeholder, Math.round(r.width), Math.round(r.height)]}).filter(([n,w,h])=>Math.min(w,h)<24);
 if (small.length) f.push('targets<24: '+JSON.stringify(small));
 const spill=[]; document.querySelectorAll('.agent-card,.panel').forEach(cd=>{const R=cd.getBoundingClientRect(); cd.querySelectorAll('span,h2,a,td,p').forEach(e=>{ if(!e.childNodes.length||!e.offsetParent) return; const rg=document.createRange(); rg.selectNodeContents(e); if([...rg.getClientRects()].some(q=>q.width>0&&(q.right>R.right+0.5||q.left<R.left-0.5))) spill.push(e.textContent.trim().slice(0,40)); }); });
 if (spill.length) f.push('text past container edge: '+[...new Set(spill)].join(' | '));
 const ph=[...document.querySelectorAll('input[placeholder]')].filter(e=>e.offsetParent).filter(e=>{const c=document.createElement('canvas').getContext('2d'); const cs=getComputedStyle(e); c.font=cs.fontSize+' '+cs.fontFamily; return c.measureText(e.placeholder).width>e.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)+1}).map(e=>e.placeholder);
 if (ph.length) f.push('placeholder cut: '+ph.join(' | '));
 const cards=document.querySelectorAll('.agent-card').length; if (cards!==10) f.push('cards '+cards);
 const imgs=[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src); if (imgs.length) f.push('broken images '+imgs.join(','));
 return {f, h: de.scrollHeight}; }"""
res={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,w,h,openws in [("front-1536x1024",1536,1024,False),("front-1440x900",1440,900,False),("workspace-1536x1024",1536,1024,True)]:
        c=b.new_context(viewport={"width":w,"height":h}); pg=c.new_page(); errs=[]
        pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: m.type=="error" and errs.append(m.text))
        pg.goto("http://127.0.0.1:8780/index.html"); pg.wait_for_load_state("networkidle"); pg.evaluate("document.fonts.ready")
        if openws:
            pg.click('.a-2 .card-hit'); pg.wait_for_selector('.ws'); pg.wait_for_timeout(300)
            assert pg.evaluate("document.activeElement.getAttribute('aria-label')")=='Close workspace'
        r=pg.evaluate(JS)
        pg.screenshot(path=str(ROOT/f"out/{name}.png"), full_page=(name=="front-1440x900"))
        pg.add_script_tag(content=AXE)
        ax=pg.evaluate("async()=>(await axe.run(document,{resultTypes:['violations']})).violations.map(v=>v.id+':'+v.nodes.length+' '+v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(', '))")
        if ax: r['f'].append('axe: '+' || '.join(ax))
        if openws:
            pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
            if pg.query_selector('.ws'): r['f'].append('Escape did not close workspace')
        if errs: r['f'].append('console: '+'; '.join(errs))
        res[name]=r; c.close()
    b.close()
for n,r in res.items():
    print('==',n,'PASS' if not r['f'] else 'FAIL', 'pageHeight',r['h'])
    for x in r['f']: print('   FAIL',x)
