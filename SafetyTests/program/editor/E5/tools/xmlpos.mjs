// Positional XML reader: nodes carry start/end offsets into the source text.
export function parse(xml){
  const root={tag:'#document',attr:{},children:[],start:0,end:xml.length,parent:null},stack=[root];
  const re=/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<[^>]+>/g;let m;
  while((m=re.exec(xml))){const v=m[0];if(v.startsWith('<!--')||v.startsWith('<?'))continue;
    if(v.startsWith('</')){const n=stack.pop();if(n.tag!==v.slice(2,-1).trim())throw Error('close '+v+' at '+m.index);n.end=m.index+v.length;continue;}
    const tag=v.match(/^<([^\s/>]+)/)[1],attr=Object.fromEntries([...v.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)].map(x=>[x[1],x[2]]));
    const parent=stack.at(-1),node={tag,attr,children:[],parent,start:m.index,openEnd:m.index+v.length,end:null};parent.children.push(node);
    if(v.endsWith('/>'))node.end=m.index+v.length;else stack.push(node);}
  if(stack.length!==1)throw Error('unclosed');return root;}
export const walk=n=>[n,...n.children.flatMap(walk)];
export const anc=(n,tag)=>{for(let p=n.parent;p;p=p.parent)if(p.tag===tag)return p;};
// line-aware range: include leading indentation and trailing newline
export function lineRange(xml,node){let s=node.start;while(s>0&&(xml[s-1]===' '||xml[s-1]==='\t'))s--;let e=node.end;if(xml[e]==='\r')e++;if(xml[e]==='\n')e++;return[s,e];}
export function applyEdits(xml,edits){edits.sort((a,b)=>b[0]-a[0]);for(let i=1;i<edits.length;i++)if(edits[i][1]>edits[i-1][0])throw Error('overlapping edits '+JSON.stringify([edits[i].slice(0,2),edits[i-1].slice(0,2)]));let out=xml;for(const[s,e,r]of edits)out=out.slice(0,s)+r+out.slice(e);return out;}
