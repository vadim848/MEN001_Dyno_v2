$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../../..").Path
$planPath=Join-Path $root 'SafetyTests/resumed-development-2026-10-21/architect/F1_RUN_RECOGNIZER_PLAN.json'
if((Get-FileHash $planPath -Algorithm SHA256).Hash.ToLower() -ne 'b52f6b0e440a09ce138ad91e633b2fcd78f431d246a4dbdabc083809a0a08b60'){throw 'Frozen F1 plan changed'}
$plan=Get-Content $planPath -Raw|ConvertFrom-Json
$out=Join-Path $root 'SafetyTests/candidates/resumed-f1/staged';[IO.Directory]::CreateDirectory($out)|Out-Null
function ReadXml($path){$x=New-Object Xml.XmlDocument;$x.PreserveWhitespace=$true;$x.Load($path);return ,$x}
foreach($e in @(@($plan.source.sal,$plan.source.salSha256),@($plan.source.sgvl,$plan.source.sgvlSha256),@($plan.source.diagram,$plan.source.diagramSha256))){if((Get-FileHash (Join-Path $root $e[0]) -Algorithm SHA256).Hash.ToLower() -ne $e[1]){throw "P0 source mismatch $($e[0])"}}
$sal=ReadXml (Join-Path $root $plan.source.sal);$gvl=ReadXml (Join-Path $root $plan.source.sgvl);$diag=ReadXml (Join-Path $root $plan.source.diagram)
function GuidFor($key){$sha=[Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes('MEN001-F1-v1:'+$key));return ([guid]::new([byte[]]$sha[0..15])).ToString()}
function Port($path){$p=$path.Split('/');return ,$sal.SelectSingleNode("//*[local-name()='Network' and @name='$($p[2])']/*[local-name()='functionBlocks']/*/*[@name='$($p[3])']/*/*/*[@name='$($p[4])']")}
function Block($path){$p=$path.Split('/');return ,$sal.SelectSingleNode("//*[local-name()='Network' and @name='$($p[2])']/*[local-name()='functionBlocks']/*/*[@name='$($p[3])']")}
function RemoveNode($n){[void]$n.ParentNode.RemoveChild($n)}
function NewSal($tag){return ,$sal.CreateElement($tag,$sal.DocumentElement.NamespaceURI)}
function Child($n,$tag){return ,$n.SelectSingleNode("./*[local-name()='$tag']")}
function Ensure($n,$tag){$c=Child $n $tag;if(!$c){$c=NewSal $tag;[void]$n.AppendChild($c)};return ,$c}
foreach($b in $plan.newBlocks){
 $template=Block $plan.newBlockTemplates.($b.functionName);$new=$template.CloneNode($true)
 foreach($n in @($new)+@($new.SelectNodes('.//*[@Id]'))){$n.SetAttribute('Id',(GuidFor ($b.name+':'+$n.Id)))}
 $new.SetAttribute('Id',$b.id);$new.SetAttribute('name',$b.name);$new.SetAttribute('instanceName',$b.name)
 foreach($port in @($new.SelectNodes(".//*[local-name()='inPort' or local-name()='outPort']"))){
  foreach($child in @($port.ChildNodes)){RemoveNode $child}
  $definition=@($b.inputs)+@($b.outputs)|Where-Object{$_.name -eq $port.name};if(!$definition){throw 'Template interface mismatch'};$port.SetAttribute('Id',$definition.id)
  if($port.LocalName -eq 'inPort'){
   $isActive=($b.functionName -eq 'safeRs' -or $port.name -in @('OrIn1','OrIn2','OrIn3'))
   $port.SetAttribute('channelInterface',$(if($isActive){'Activated'}else{'Deactivated'}));$port.RemoveAttribute('deactivate1');$port.RemoveAttribute('deactivate2')
   if($isActive){$port.SetAttribute('deactivate1',$(if($b.functionName -eq 'safeOr' -and $port.name -eq 'OrIn3'){'Make Contact (NO)'}else{'Break Contact (NC)'}))}
  }
 }
 $relationship=NewSal 'networkHasFunctionBlocks';$relationship.SetAttribute('Id',(GuidFor ($b.name+':relationship')));[void]$relationship.AppendChild($new);[void]$template.ParentNode.ParentNode.AppendChild($relationship)
}
foreach($e in $plan.wireRemove){$n=$sal.SelectSingleNode("//*[local-name()='wiredLink' and @Id='$($e.id)']");if(!$n){throw 'Missing removed wire'};RemoveNode $n;foreach($s in @($diag.SelectNodes("//wiredLinkConnector[wiredLinkMoniker/@Id='$($e.id)']"))){RemoveNode $s}}
foreach($e in $plan.wireAdd){$wire=NewSal 'wiredLink';$wire.SetAttribute('Id',$e.id);$m=NewSal 'inPortMoniker';$m.SetAttribute('name',$e.to);[void]$wire.AppendChild($m);[void](Ensure (Port $e.from) 'targetFunctionBlockPorts').AppendChild($wire)}
foreach($d in $plan.portAttributeDelta){$p=Port $d.path;if($p.Id -ne $d.portId){throw 'Port identity mismatch'};foreach($prop in $d.after.PSObject.Properties){if($prop.Name -eq 'removeDeactivate1'){$p.RemoveAttribute('deactivate1')}else{$p.SetAttribute($prop.Name,[string]$prop.Value)}}}
foreach($d in $plan.localReaderRemove){$matches=@($sal.SelectNodes("//*[local-name()='fbPortUsage']")|Where-Object{$_.SelectSingleNode(".//*[@name='$($d.target)']")});if($matches.Count -ne 1){throw 'Reader removal cardinality'};RemoveNode $matches[0].ParentNode}
foreach($d in $plan.localReaderAdd){
 $v=$sal.SelectSingleNode("//*[local-name()='variable' and @Id='$($d.variableId)']");if(!$v){throw 'Missing local Symbol'}
 $u=$v.SelectSingleNode("./*[local-name()='targetUsages']/*/*/*[local-name()='usages']")
 $rel=NewSal 'variableUsagesHasUsages';$rel.SetAttribute('Id',(GuidFor ($d.target+':usageWrapper')))
 $usage=NewSal 'fbPortUsage';$usage.SetAttribute('Id',(GuidFor ($d.target+':usage')))
 $container=NewSal 'functionBlockPort';$reference=NewSal 'fbPortUsageReferencesFunctionBlockPort';$reference.SetAttribute('Id',(GuidFor ($d.target+':portRelationship')))
 $mon=NewSal 'inPortMoniker';$mon.SetAttribute('name',$d.target);[void]$reference.AppendChild($mon);[void]$container.AppendChild($reference);[void]$usage.AppendChild($container);[void]$rel.AppendChild($usage);[void]$u.AppendChild($rel)
}
foreach($d in $plan.globalReaderAdd){
 $p=Port $d.target;$container=Ensure $p 'fbPortGlobalVariableReferences';$rel=NewSal 'functionBlockPortHasFbPortGlobalVariableReferences';$rel.SetAttribute('Id',(GuidFor ($d.target+':globalRelationship')))
 $ref=NewSal 'fbPortGlobalVariableReference';$ref.SetAttribute('Id',$d.referenceId);$ref.SetAttribute('variableId',$d.variableId);$ref.SetAttribute('lastKnownPath',('GVL1.'+$d.name));[void]$rel.AppendChild($ref);[void]$container.AppendChild($rel)
 $v=$gvl.SelectSingleNode("//Variable[@Id='$($d.variableId)']/TargetUsages");if(!$v){throw 'Missing GVL variable targets'}
 $usage=$gvl.CreateElement('FbPortUsage');$usage.SetAttribute('Id',(GuidFor ($d.target+':sgvlUsage')));$id=$gvl.CreateElement('ModelElementId');$id.InnerText=$d.portId;[void]$usage.AppendChild($id);[void]$v.AppendChild($usage)
}
$retired=Block $plan.retire.path;RemoveNode $retired.ParentNode;foreach($s in @($diag.SelectNodes("//*[@name='$($plan.retire.path)']"))){RemoveNode $s.ParentNode}
foreach($b in $plan.fullOrderedManifest){$node=Block $b.path;if($node.Id -ne $b.id){throw "Order identity mismatch $($b.path)"};$node.SetAttribute('orderOfExecution',[string]$b.newOrder)}
foreach($x in @(@($sal,'TwinSafeGroup1.sal'),@($gvl,'GVL1.sgvl'),@($diag,'TwinSafeGroup1.sal.diagram'))){$settings=New-Object Xml.XmlWriterSettings;$settings.Encoding=New-Object Text.UTF8Encoding($false);$w=[Xml.XmlWriter]::Create((Join-Path $out $x[1]),$settings);$x[0].Save($w);$w.Dispose()}
Write-Output "Staged exact isolated F1 at $out (stored CRC stale until native save)"
