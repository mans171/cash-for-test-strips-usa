import difflib, re, html, itertools, statistics, os
BUILD="/Users/feldonrichards/code/cash-for-test-strips-usa/.next/server/app/blog"
TAG=re.compile(r"<[^>]+>"); DROP=re.compile(r"<(script|style)\b.*?</\1>",re.S|re.I); WS=re.compile(r"\s+")
src=open("/Users/feldonrichards/code/cash-for-test-strips-usa/lib/blog-posts.ts").read()
posts=re.findall(r'stateCode: "(\w+)",\s*stateName: "([^"]+)",\s*slug: "([^"]+)"',src)
angles=dict(re.findall(r'\n  (\w{2}): "([a-z-]+)",',open("/Users/feldonrichards/code/cash-for-test-strips-usa/lib/blog-angles.ts").read()))
def vis(slug,name):
    p=f"{BUILD}/{slug}.html"
    if not os.path.exists(p): return ""
    t=open(p,encoding="utf-8").read()
    t=DROP.sub(" ",t); t=TAG.sub(" ",t); t=html.unescape(t); t=WS.sub(" ",t).strip()
    t=t.replace(name,"STATE")
    for w in name.split(): t=t.replace(w,"STATE")
    return t
texts={c:vis(s,n) for c,n,s in posts}
texts={k:v for k,v in texts.items() if v}
same=[];diff=[];allp=[]
for a,b in itertools.combinations(sorted(texts),2):
    r=difflib.SequenceMatcher(None,texts[a],texts[b]).ratio()*100
    allp.append((r,a,b)); (same if angles.get(a)==angles.get(b) else diff).append(r)
print(f"posts {len(texts)} | pairs {len(allp)}")
print(f"ALL         mean {statistics.mean([r for r,_,_ in allp]):5.1f}%  median {statistics.median([r for r,_,_ in allp]):5.1f}%  max {max(allp)[0]:5.1f}%")
print(f"same angle  mean {statistics.mean(same):5.1f}%  median {statistics.median(same):5.1f}%  max {max(same):5.1f}%")
print(f"diff angle  mean {statistics.mean(diff):5.1f}%  median {statistics.median(diff):5.1f}%  max {max(diff):5.1f}%")
print(f">=90%: {sum(1 for r,_,_ in allp if r>=90)}   >=80%: {sum(1 for r,_,_ in allp if r>=80)}")
print("worst 5:")
for r,a,b in sorted(allp,reverse=True)[:5]:
    print(f"  {a} vs {b} {r:.1f}% ({angles.get(a)}/{angles.get(b)})")
