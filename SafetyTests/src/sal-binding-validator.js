import fs from "node:fs";

// Structural XML reader: relationships are resolved by document scope and GUID,
// never by matching an alias basename to a qualified global reference.
export function readBindingXml(xml) {
  const root={ tag:"#document",children:[],text:"",namespaces:{xml:"http://www.w3.org/XML/1998/namespace"} }, stack=[root];
  for(const token of xml.matchAll(/<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<[^>]+>|[^<]+/g)) {
    const value=token[0]; if(value.startsWith("<!--")||value.startsWith("<?"))continue;
    if(value.startsWith("</")){const name=value.slice(2,-1).trim();if(stack.pop()?.tag!==name)throw Error(`XML closing role ${name}`);}
    else if(value.startsWith("<")) {
      if(value.startsWith("<!"))throw Error("Unsupported XML declaration");
      const tag=value.match(/^<([^\s/>]+)/)[1], attr=Object.fromEntries([...value.matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1],m[3]]));
      const parent=stack.at(-1),namespaces={...parent.namespaces};
      for(const [name,uri]of Object.entries(attr)) {
        if(name==="xmlns")namespaces[""]=uri;
        else if(name.startsWith("xmlns:"))namespaces[name.slice(6)]=uri;
      }
      const parts=tag.split(":"),prefix=parts.length===2?parts[0]:"";
      if(parts.length>2||(prefix&&!Object.hasOwn(namespaces,prefix)))throw Error(`Undeclared/invalid XML namespace prefix ${tag}`);
      for(const name of Object.keys(attr))if(name.includes(":")&&!name.startsWith("xmlns:")&&!Object.hasOwn(namespaces,name.split(":")[0]))throw Error(`Undeclared XML attribute prefix ${name}`);
      const node={ tag,localName:parts.at(-1),prefix,namespace:namespaces[prefix]??"",namespaces,attr,children:[],parent,text:"" };parent.children.push(node);
      if(!value.endsWith("/>"))stack.push(node);
    }else stack.at(-1).text+=value;
  }
  if(stack.length!==1||root.children.length!==1)throw Error("Unclosed XML roles or multiple roots");return root;
}
const walk=n=>[n,...n.children.flatMap(walk)];
const ancestor=(n,tag)=>{for(let p=n.parent;p;p=p.parent)if(p.tag===tag)return p;};
const chain=(n,tags)=>tags.every((tag,i)=>{let p=n;for(let j=0;j<=i;j++)p=p?.parent;return p?.tag===tag;});

export function validateSalBindings(salXml, sgvlXml, { globalName="GVL1" }={}) {
  const errors=[],warnings=[];
  let sal,gvl;try{sal=readBindingXml(salXml);gvl=readBindingXml(sgvlXml);}catch(e){return {status:"ERROR",errors:[e.message],warnings};}
  const nodes=walk(sal),globalNodes=walk(gvl),ports=new Map(),symbols=new Map(),producers=new Map(),edges=[];
  const application=sal.children[0],globalDocument=gvl.children[0];
  if(application?.tag!=="safetyApplication"||application.attr.xmlns!=="http://schemas.microsoft.com/dsltools/SafetyApplicationLanguage")errors.push("SAL application namespace/root mismatch");
  if(globalDocument?.tag!=="GlobalVariables")errors.push("SGVL document root mismatch");
  for(const [label,list,expected]of [["SAL",nodes,"http://schemas.microsoft.com/dsltools/SafetyApplicationLanguage"],["SGVL",globalNodes,""]]) {
    for(const n of list)if(n.tag!=="#document") {
      if(n.namespace!==expected)errors.push(`${label} foreign XML namespace ${n.tag}: ${n.namespace}`);
      // The serializer/parser supports the observed unprefixed DSL form only.
      // Fail closed even for a same-URI prefixed spelling rather than validate
      // one expanded name and let the functional regex reader skip it.
      if(n.prefix)errors.push(`${label} unsupported prefixed DSL representation ${n.tag}`);
    }
  }
  for(const [label,list]of [["SAL",nodes],["SGVL",globalNodes]]) {
    const ids=new Set();for(const n of list)if(n.attr?.Id){if(ids.has(n.attr.Id))errors.push(`${label} duplicate Id ${n.attr.Id}`);ids.add(n.attr.Id);}
  }
  for(const n of globalNodes.filter(n=>n.tag==="Variable")) {
    const name=n.children.find(c=>c.tag==="Name")?.text.trim();
    symbols.set(n.attr.Id,{ name,qualified:`${globalName}.${name}`,node:n });
  }
  for(const n of nodes.filter(n=>["inPort","outPort"].includes(n.tag))) {
    const block=ancestor(n,"networkHasFunctionBlocks")?.children[0],network=ancestor(n,"Network");
    if(!block||!network){errors.push(`Invalid port owner ${n.attr.Id}`);continue;}
    const path=`//${network.attr.name}/${block.attr.name}/${n.attr.name}`;
    if(ports.has(path))errors.push(`Duplicate port path ${path}`);ports.set(path,n);
    const wrapper=n.tag==="inPort"?"functioBlockHasInPorts":"functionBlockHasOutPorts";
    if(!chain(n,[wrapper,n.tag==="inPort"?"inPorts":"outPorts"]))errors.push(`Invalid port relationship wrapper ${path}`);
  }
  const bind=(target,source)=>{if(!producers.has(target))producers.set(target,new Set());producers.get(target).add(source);};
  const portPath=n=>[...ports].find(([,p])=>p===n)?.[0];
  const globalRefs=[];
  for(const n of nodes.filter(n=>n.tag==="fbPortGlobalVariableReference")) {
    const port=ancestor(n,"inPort")??ancestor(n,"outPort"),path=portPath(port),symbol=symbols.get(n.attr.variableId);
    if(!chain(n,["functionBlockPortHasFbPortGlobalVariableReferences","fbPortGlobalVariableReferences",port?.tag]))errors.push(`Global wrapper ${path??n.attr.Id}`);
    if(!symbol)errors.push(`Global namespace GUID unresolved ${n.attr.variableId} at ${path}`);
    else {
      if(n.attr.lastKnownPath!==symbol.qualified)errors.push(`Global qualified path mismatch ${n.attr.lastKnownPath} != ${symbol.qualified}`);
      const role=port?.tag==="inPort"?"TargetUsages":"SourceUsages";
      const container=symbol.node.children.find(c=>c.tag===role);
      if(!container||!walk(container).some(c=>c.tag==="ModelElementId"&&c.text.trim()===port?.attr.Id))errors.push(`Missing SGVL ${role} ${symbol.qualified} port ${port?.attr.Id}`);
      if(port?.tag==="inPort")bind(path,`global:${symbol.qualified}`);
      globalRefs.push({ portId:port?.attr.Id,variableId:n.attr.variableId,qualified:symbol.qualified,name:symbol.name });
    }
  }
  const wirePairs=new Set();
  for(const n of nodes.filter(n=>n.tag==="wiredLink")) {
    const port=n.parent?.parent,moniker=n.children[0],owner=portPath(port);
    const expected=port?.tag==="outPort"?"inPortMoniker":"outPortMoniker";
    if(n.parent?.tag!=="targetFunctionBlockPorts"||!ports.has(owner)||n.children.length!==1||moniker?.tag!==expected){errors.push(`Wire relationship/direction ${n.attr.Id}`);continue;}
    const other=ports.get(moniker.attr.name);
    if(!other){errors.push(`Wire moniker unresolved ${moniker.attr.name}`);continue;}
    if(other.tag===(port.tag)){errors.push(`Wire endpoint direction ${moniker.attr.name}`);continue;}
    const from=port.tag==="outPort"?owner:moniker.attr.name,to=port.tag==="inPort"?owner:moniker.attr.name,pair=`${from}->${to}`;
    if(wirePairs.has(pair))errors.push(`Duplicate wire pair ${pair}`);wirePairs.add(pair);edges.push({from,to,id:n.attr.Id});bind(to,`port:${from}`);
  }
  const aliasPairs=new Set();
  for(const n of nodes.filter(n=>["inPortMoniker","outPortMoniker"].includes(n.tag)&&!ancestor(n,"wiredLink"))) {
    const variable=ancestor(n,"variable"),port=ports.get(n.attr.name);
    if(!variable){errors.push(`Orphan moniker ${n.attr.name}`);continue;}
    const target=n.tag==="inPortMoniker",role=target?"targetUsages":"sourceUsages";
    const expected=["fbPortUsageReferencesFunctionBlockPort","functionBlockPort","fbPortUsage","variableUsagesHasUsages","usages","variableUsages","variableHasTargetUsages",role];
    // Source relationship uses its own role spelling.
    if(!target)expected[6]="variableHasSourceUsages";
    if(!chain(n,expected))errors.push(`Alias usage wrapper ${variable.attr.name}/${n.attr.name}`);
    if(!port)errors.push(`Alias moniker unresolved ${n.attr.name}`);
    else if(port.tag!==(target?"inPort":"outPort"))errors.push(`Alias endpoint direction ${n.attr.name}`);
    const pair=`${variable.attr.Id}:${n.tag}:${n.attr.name}`;
    if(aliasPairs.has(pair))errors.push(`Duplicate alias usage ${pair}`);aliasPairs.add(pair);
    if(target)bind(n.attr.name,`alias:${variable.attr.Id}`);
  }
  // Every input has one binding mechanism; aliases and globals cannot silently
  // compete with direct wires. Unconnected original inputs are reported elsewhere.
  for(const [target,sources]of producers)if(sources.size>1)errors.push(`Conflicting producers ${target}: ${[...sources].join(",")}`);
  for(const [path,port]of ports)if(port.tag==="inPort" &&
    (/\/FBAnd(?:UnlockHold|LvCurrentPermit|LvSetPermit)\//.test(path)||/\/FBOr3\/OrIn[34]$/.test(path)) &&
    port.attr.channelInterface==="Activated" && !producers.has(path))errors.push(`Missing binding on introduced active input ${path}`);
  return { status:errors.length?"ERROR":"PASS",errors,warnings,globalRefs,edges,portCount:ports.size };
}

export function assertSalBindings(salFile,sgvlFile) {
  const result=validateSalBindings(fs.readFileSync(salFile,"utf8"),fs.readFileSync(sgvlFile,"utf8"));
  if(result.status!=="PASS")throw Error(`SAL binding validation failed before execution:\n${result.errors.join("\n")}`);
  return result;
}
