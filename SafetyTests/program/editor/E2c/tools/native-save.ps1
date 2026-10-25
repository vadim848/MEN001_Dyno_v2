# E2c offline native serialization (copy of program/editor/E2a/tools/native-save.ps1 via E2a-RC; only expected counts, labels and transaction names changed) via installed TwinSAFE writers.
# Adapted from program/editor/E2-R1/tools/native-save.ps1 (load/save/CRC/GVL) and
# resumed-development-2026-10-21/editor/f1/native-f1.ps1 (FixUpDiagram creates presentations
# only for the new blocks/ports and new wires listed in STAGING.json). Does not touch canonical.
param([string]$InputDir,[string]$OutputDir,[string]$ReportPath,[switch]$Reload,[switch]$NoFixUp,[string]$StagingJson,[string]$GeometryFrom)
$ErrorActionPreference='Stop'
$EXP=@{networks=14;variables=79;blocks=229;ports=1944;gvl=63}
[IO.Directory]::CreateDirectory($OutputDir)|Out-Null
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class E2aNativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[E2aNativeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
Write-Output "Framework $([Environment]::Version); Apartment $([Threading.Thread]::CurrentThread.ApartmentState)"
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$transaction=$store.TransactionManager.BeginTransaction('E2c offline native serialization',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $InputDir 'TwinSafeGroup1.sal'),$partition,(Join-Path $InputDir 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 Write-Output "Load failed=$($result.Failed) nativeCrcValid=$valid calculated=$crc"
 $messages=@();foreach($message in $result){$messages+="$($message.Kind): $($message.Message)";Write-Output "Serialization $($message.Kind): $($message.Message)"}
 if($result.Failed -or !$model){throw 'Native load failed'}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 Write-Output "Counts networks=$($model.Networks.Count) variables=$($model.Variables.Count) blocks=$($blocks.Count) ports=$($ports.Count)"
 if($model.Networks.Count -ne $EXP.networks -or $model.Variables.Count -ne $EXP.variables -or $blocks.Count -ne $EXP.blocks -or $ports.Count -ne $EXP.ports){throw "Native counts differ from plan ($($EXP.networks)/$($EXP.variables)/$($EXP.blocks)/$($EXP.ports))"}
 $orders=@($blocks|ForEach-Object{[int]$_.OrderOfExecution}|Sort-Object)
 for($i=0;$i -lt $orders.Count;$i++){if($orders[$i] -ne $i+1){throw "orderOfExecution not contiguous at $i -> $($orders[$i])"}}
 $names=@($model.Variables|ForEach-Object{[string]$_.Name})
 foreach($n in @('in_LV_Faulty_FBK','in_HV_Faulty_FBK','outPLC_LV_Faulty','outPLC_HV_Faulty')){if($names -notcontains $n){throw "Renamed variable missing $n"}}
 foreach($n in @('in_LV_Healthy_FBK','in_HV_Healthy_FBK','outPLC_LV_Healthy','outPLC_HV_Healthy')){if($names -contains $n){throw "Old variable name still present $n"}}
 $diagram=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){throw 'Existing diagram missing; regeneration prohibited'}
 $transaction.Commit();$transaction.Dispose();$transaction=$null
 $fixed=@{blocks=0;ports=0;wires=0}
 if(!$Reload -and !$NoFixUp){
  $staging=Get-Content $StagingJson -Raw|ConvertFrom-Json
  $transaction=$store.TransactionManager.BeginTransaction('E2c: create presentations only for new blocks/ports and new wires',$false)
  [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel]::EnableDiagramRules($store)
  foreach($b in $staging.newBlocks){
   $block=$store.ElementDirectory.FindElement([guid]$b.id);if(!$block){throw "Missing new block $($b.path)"}
   $network=$model.Networks|Where-Object{$_.Name -eq $b.path.Split('/')[0]}
   [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($network,$block);$fixed.blocks++
   foreach($p in @($block.InPorts)+@($block.OutPorts)+@($block.ParameterPorts)){if($p){[Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($block,$p);$fixed.ports++}}
  }
  foreach($e in $staging.addedWires){
   $wire=$store.ElementDirectory.FindElement([guid]$e.id);if(!$wire){throw "Missing added wire $($e.id)"}
   $n=$model.Networks|Where-Object{$_.Name -eq $e.from.Split('/')[0]}
   [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($n,$wire);$fixed.wires++
  }
  $transaction.Commit();$transaction.Dispose();$transaction=$null
 }
 $labels=@()
 foreach($entry in @(@{t='//Network6/HEALTHY_OK/AndIn1';e='in_LV_Faulty_FBK'},@{t='//Network6/HEALTHY_OK/AndIn2';e='in_HV_Faulty_FBK'},@{t='//Network11/FBAnd4/AndIn3';e='in_LV_Faulty_FBK'},@{t='//Network3/FBDecouple2/DecIn2';e='in_False_SI2_CH8'},@{t='//Network6/FBAnd9/AndIn1';e='out_EStop_Status'},@{t='//Network12/FBAnd6/AndIn2';e='in_HV_C2_FBK'},@{t='//Network12/FBAnd6/AndIn3';e='in_HV_Faulty_FBK'},@{t='//Network11/FBAnd4/AndIn2';e='in_LV_C1_FBK'},@{t='//Network3/G10_EXIT/AndIn3';e='in_Reset_PB'},@{t='//Network3/G10_EXIT/AndIn8';e='out_HV_C2'},@{t='//Network1/FBAnd1/AndIn4';e='linkSafeConnectorScope'},@{t='//Network6/HEALTHY_OK/AndIn3';e='linkCoverClosed'},@{t='//Network1/FBOrIlRunOk/OrIn3';e='linkRunDownOwner'},@{t='//Network3/FBAndBootFbkOff/AndIn1';e='in_LV_C1_FBK'},@{t='//SafeResumption/HLT_LV/AndIn1';e='in_LV_Faulty_FBK'},@{t='//RndPhysicalCompact/GATE_SG_SET/OrIn2';e='linkHltLvLost'},@{t='//RndPhysicalCompact/GATE_030/OrIn6';e='linkHltLvLost'})){
  $parts=$entry.t.Split('/');$n=$model.Networks|Where-Object{$_.Name -eq $parts[2]};$b=$n.FunctionBlocks|Where-Object{$_.Name -eq $parts[3]};$p=$b.InPorts|Where-Object{$_.Name -eq $parts[4]}
  $shape=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($p)|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.InPortShape]}|Select-Object -First 1
  if(!$shape){throw "Missing port shape $($entry.t)"}
  $d=$shape.AssignedVariableDecorator
  $label=@{target=$entry.t;expected=$entry.e;text=$d.Field.GetDisplayText($shape);visible=$d.GetVisible($shape);fieldVisible=$d.Field.GetVisible($shape)}
  $labels+=$label
  if($label.text -ne $label.expected -or !$label.visible -or !$label.fieldVisible){throw "Native label mismatch $($entry.t) expected=$($entry.e) got=$($label.text) visible=$($label.visible)/$($label.fieldVisible)"}
 }
 Write-Output "Native labels passed count=$($labels.Count)"
 if(!$Reload){
  $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
  $encoding=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding
  $helper.SaveModelAndDiagram($save,$model,(Join-Path $OutputDir 'TwinSafeGroup1.sal'),$diagram,(Join-Path $OutputDir 'TwinSafeGroup1.sal.diagram'),$encoding,$false)
  Write-Output "Native save failed=$($save.Failed)"
  foreach($message in $save){Write-Output "Save $($message.Kind): $($message.Message)"}
  if($save.Failed){throw 'Native save failed'}
 }elseif(!$valid){throw 'Fresh native SAL/diagram CRC invalid'}
 $stream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes((Join-Path $InputDir 'GVL1.sgvl')))
 $gvl=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($stream)
 Write-Output "SGVL count=$($gvl.Count) FileCrcMismatch=$($gvl.FileCrcMismatch)"
 if($gvl.Count -ne $EXP.gvl){throw "SGVL count differs from $($EXP.gvl)"}
 if(!$Reload){$saved=$gvl.SaveToMemoryStream();[IO.File]::WriteAllBytes((Join-Path $OutputDir 'GVL1.sgvl'),$saved.ToArray())}elseif($gvl.FileCrcMismatch){throw 'Fresh native SGVL CRC invalid'}
 $geometryCount=0;$maxAll=0.0;$missing=0;$containers=@()
 if($GeometryFrom){
  [xml]$ref=Get-Content (Join-Path $GeometryFrom 'TwinSafeGroup1.sal.diagram') -Raw
  foreach($node in $ref.SelectNodes('//*[@absoluteBounds]')){
   $element=$store.ElementDirectory.FindElement([guid]$node.Id)
   if(!$element){$missing++;continue}
   $bounds=$element.AbsoluteBounds;$expected=@($node.absoluteBounds.Split(',')|ForEach-Object{[double]::Parse($_,[Globalization.CultureInfo]::InvariantCulture)})
   $actual=@($bounds.X,$bounds.Y,$bounds.Width,$bounds.Height);$maxDelta=0.0
   for($i=0;$i -lt 4;$i++){$maxDelta=[Math]::Max($maxDelta,[Math]::Abs($expected[$i]-$actual[$i]))}
   $geometryCount++
   if(@('safetyApplicationLanguageDiagram','networkSwimLane') -contains $node.LocalName){if($maxDelta -gt 0.000000001){$containers+=@{id=[string]$node.Id;tag=$node.LocalName;expected=$node.absoluteBounds;actual="$($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)";maxDelta=$maxDelta}};continue}
   $maxAll=[Math]::Max($maxAll,$maxDelta)
   if($maxDelta -gt 0.000000001){throw "Native geometry drift $($node.Id) $($node.LocalName) delta=$maxDelta"}
  }
  Write-Output "Geometry compared shapes=$geometryCount notInModel=$missing maxDelta=$maxAll"
 }
 $report=@{framework=[Environment]::Version.ToString();reload=[bool]$Reload;input=$InputDir;nativeCrcValid=$valid;calculatedCrc=$crc;loadMessages=$messages;counts=@{networks=$model.Networks.Count;variables=$model.Variables.Count;blocks=$blocks.Count;ports=$ports.Count;gvl=$gvl.Count;gvlFileCrcMismatch=$gvl.FileCrcMismatch};fixUp=$fixed;labels=$labels;geometryFrom=$GeometryFrom;geometryCompared=$geometryCount;geometryNotInModel=$missing;geometryMaxDelta=$maxAll;containerBoundsChanged=$containers;limits='Offline native serialization/CRC/decorator checks; not IDE Verify/Build, not target/project CRC.'}
 $report|ConvertTo-Json -Depth 6|Set-Content $ReportPath -Encoding UTF8
}finally{if($transaction){$transaction.Dispose()};$store.Dispose()}
