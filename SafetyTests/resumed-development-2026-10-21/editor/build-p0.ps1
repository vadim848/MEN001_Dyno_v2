$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
$out=Join-Path $root 'SafetyTests/candidates/resumed-p0/staged'
[IO.Directory]::CreateDirectory($out)|Out-Null
$ledger=Get-Content "$PSScriptRoot/../architect/P0_REBASE_LEDGER.json" -Raw|ConvertFrom-Json
function ReadXml($path){$x=New-Object Xml.XmlDocument;$x.PreserveWhitespace=$true;$x.Load($path);return ,$x}
$sal=ReadXml (Join-Path $root $ledger.source.sal)
$gvl=ReadXml (Join-Path $root $ledger.source.sgvl)
$diag=ReadXml (Join-Path $root ($ledger.source.sal+'.diagram'))
foreach($pair in @(@($ledger.source.sal,$ledger.source.salSha256),@($ledger.source.sgvl,$ledger.source.sgvlSha256),@(($ledger.source.sal+'.diagram'),$ledger.source.diagramSha256))){if((Get-FileHash (Join-Path $root $pair[0]) -Algorithm SHA256).Hash.ToLower() -ne $pair[1]){throw "Source changed $($pair[0])"}}
function ById($x,$id){$n=$x.SelectSingleNode("//*[@Id='$id']");if(!$n){throw "Missing Id $id"};return ,$n}
function Port($path){$p=$path.Split('/');return ,$sal.SelectSingleNode("//*[local-name()='Network' and @name='$($p[2])']/*[local-name()='functionBlocks']/*/*[@name='$($p[3])']/*/*/*[@name='$($p[4])']")}
function RemoveNode($n){[void]$n.ParentNode.RemoveChild($n)}
function Child($n,$tag){return ,$n.SelectSingleNode("./*[local-name()='$tag']")}
function NewSal($tag){return ,$sal.CreateElement($tag,$sal.DocumentElement.NamespaceURI)}
function EnsureChild($n,$tag){$c=Child $n $tag;if(!$c){$c=NewSal $tag;[void]$n.AppendChild($c)};return ,$c}
$moveMap=@{}
foreach($m in $ledger.wireDelta.globalWriterMoves){$old=($m.originalRefs|Where-Object direction -eq writer).path;$moveMap[(Port $old).Id]=$m.newWriterId;$container=Child (Port $old) 'fbPortGlobalVariableReferences';[void](Port $m.newWriter).AppendChild($container)}
foreach($m in $ledger.wireDelta.globalReaderReplacements){
 $refs=@($sal.SelectNodes("//*[local-name()='fbPortGlobalVariableReference' and @variableId='$($m.variableId)']")|Where-Object { $_.ParentNode.ParentNode.ParentNode.LocalName -eq 'inPort' -and $_.ParentNode.ParentNode.ParentNode.ParentNode.ParentNode.ParentNode.Id -in @($ledger.retired.id) })
 # Pick each original relay reader once; preserve native relationship and reference IDs.
 if(!$refs.Count){throw "No retired reader $($m.variable)"};$oldPort=$refs[0].ParentNode.ParentNode.ParentNode
 $moveMap[$oldPort.Id]=$m.targetId
 [void](Port $m.target).AppendChild((Child $oldPort 'fbPortGlobalVariableReferences'))
}
foreach($m in $ledger.wireDelta.aliasReaderMoves){
 $old=Port $m.oldLogicReader;$moveMap[$old.Id]=$m.newPortId
 foreach($u in @($sal.SelectNodes("//*[local-name()='fbPortUsage']"))){$mon=$u.SelectSingleNode(".//*[@name='$($m.oldLogicReader)']");if($mon){$mon.SetAttribute('name',$m.newLogicReader)}}
}
# The complementary previous-level RS reset readers are retired, rather than duplicated on the new decouple channel.
$retiredPaths=@($ledger.retired.path)
foreach($u in @($sal.SelectNodes("//*[local-name()='fbPortUsage']"))){$mon=$u.SelectSingleNode(".//*[@name]");if($mon -and (($mon.name -replace '/[^/]+$','') -in $retiredPaths)){RemoveNode $u.ParentNode}}
foreach($n in @($gvl.SelectNodes('//FbPortUsage'))){$id=$n.ModelElementId;if($moveMap.ContainsKey($id)){$n.ModelElementId=$moveMap[$id]}}
# Any SGVL consumers not moved must not reference retired interfaces.
$retiredPortIds=@();foreach($r in $ledger.retired){$b=ById $sal $r.id;$retiredPortIds+=@($b.SelectNodes(".//*[local-name()='inPort' or local-name()='outPort']")|ForEach-Object Id)}
foreach($n in @($gvl.SelectNodes('//FbPortUsage'))){if($n.ModelElementId -in $retiredPortIds){RemoveNode $n}}
foreach($e in $ledger.wireDelta.removedWires){RemoveNode (ById $sal $e.id);foreach($w in @($diag.SelectNodes("//wiredLinkConnector[wiredLinkMoniker/@Id='$($e.id)']"))){RemoveNode $w}}
foreach($e in $ledger.wireDelta.addedWires){$p=Port $e.from;$w=NewSal 'wiredLink';$w.SetAttribute('Id',$e.id);$m=NewSal 'inPortMoniker';$m.SetAttribute('name',$e.to);[void]$w.AppendChild($m);[void](EnsureChild $p 'targetFunctionBlockPorts').AppendChild($w)}
foreach($p in @('//RndPhysicalCompact/GATE_025/AndIn3','//RndPhysicalCompact/GATE_026/AndIn3','//RndPhysicalCompact/GATE_029/OrIn4','//Network7/FBAnd8/AndIn3','//Network7/FBAnd8/AndIn4')){$n=Port $p;$n.SetAttribute('channelInterface','Activated');$n.SetAttribute('deactivate1','Break Contact (NC)')}
foreach($r in $ledger.retired){RemoveNode (ById $sal $r.id).ParentNode;foreach($shape in @($diag.SelectNodes("//*[@name='$($r.path)']"))){RemoveNode $shape.ParentNode}}
foreach($r in $ledger.retainedOrder){$p=$r.path.Split('/');$b=$sal.SelectSingleNode("//*[local-name()='Network' and @name='$($p[2])']/*[local-name()='functionBlocks']/*/*[@name='$($p[3])']");$b.SetAttribute('orderOfExecution',[string]$r.new)}
foreach($x in @(@($sal,'TwinSafeGroup1.sal'),@($gvl,'GVL1.sgvl'),@($diag,'TwinSafeGroup1.sal.diagram'))){$settings=New-Object Xml.XmlWriterSettings;$settings.Encoding=New-Object Text.UTF8Encoding($false);$settings.Indent=$false;$w=[Xml.XmlWriter]::Create((Join-Path $out $x[1]),$settings);$x[0].Save($w);$w.Dispose()}
$moveMap|ConvertTo-Json|Set-Content "$PSScriptRoot/PORT_MOVES.json"
Write-Output "Staged isolated P0 at $out; CRC deliberately untouched pending native save"
