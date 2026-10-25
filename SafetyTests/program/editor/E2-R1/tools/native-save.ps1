# E2-R1 offline native serialization via installed TwinSAFE writers (adapted from
# safe-input-validation-repair/editor/native-save.ps1). Does not touch canonical.
param([string]$InputDir,[string]$OutputDir,[string]$ReportPath,[switch]$Reload,[string]$GeometryFrom)
$ErrorActionPreference='Stop'
[IO.Directory]::CreateDirectory($OutputDir)|Out-Null
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class R1NativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[R1NativeResolver]::Register($folders)
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
$transaction=$store.TransactionManager.BeginTransaction('E2-R1 offline native serialization',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $InputDir 'TwinSafeGroup1.sal'),$partition,(Join-Path $InputDir 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 Write-Output "Load failed=$($result.Failed) nativeCrcValid=$valid calculated=$crc"
 $messages=@();foreach($message in $result){$messages+="$($message.Kind): $($message.Message)";Write-Output "Serialization $($message.Kind): $($message.Message)"}
 if($result.Failed -or !$model){throw 'Native load failed'}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 Write-Output "Counts networks=$($model.Networks.Count) variables=$($model.Variables.Count) blocks=$($blocks.Count) ports=$($ports.Count)"
 if($model.Networks.Count -ne 14 -or $model.Variables.Count -ne 75 -or $blocks.Count -ne 215 -or $ports.Count -ne 1832){throw 'Native counts differ from plan (14/75/215/1832)'}
 $orders=@($blocks|ForEach-Object{[int]$_.OrderOfExecution}|Sort-Object)
 for($i=0;$i -lt $orders.Count;$i++){if($orders[$i] -ne $i+1){throw "orderOfExecution not contiguous at $i -> $($orders[$i])"}}
 $diagram=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){throw 'Existing diagram missing; regeneration prohibited'}
 $labels=@()
 foreach($entry in @(@{t='//Network3/FBDecouple2/DecIn2';e='in_False_SI2_CH8'},@{t='//Network6/FBAnd9/AndIn1';e='out_EStop_Status'},@{t='//Network1/FBOr12/OrIn1';e='out_Step2'})){
  $parts=$entry.t.Split('/');$n=$model.Networks|Where-Object{$_.Name -eq $parts[2]};$b=$n.FunctionBlocks|Where-Object{$_.Name -eq $parts[3]};$p=$b.InPorts|Where-Object{$_.Name -eq $parts[4]}
  $shape=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($p)|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.InPortShape]}|Select-Object -First 1
  if(!$shape){throw "Missing port shape $($entry.t)"}
  $d=$shape.AssignedVariableDecorator
  $label=@{target=$entry.t;expected=$entry.e;text=$d.Field.GetDisplayText($shape);visible=$d.GetVisible($shape);fieldVisible=$d.Field.GetVisible($shape)}
  $labels+=$label
  if($label.text -ne $label.expected -or !$label.visible -or !$label.fieldVisible){throw "Native label mismatch $($entry.t) expected=$($entry.e) got=$($label.text) visible=$($label.visible)/$($label.fieldVisible)"}
 }
 Write-Output "Native labels passed count=$($labels.Count)"
 $transaction.Commit()
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
 if($gvl.Count -ne 65){throw 'SGVL count differs from 65'}
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
   if(@('safetyApplicationLanguageDiagram','networkSwimLane') -contains $node.LocalName){if($maxDelta -gt 0.000000001){$containers+=@{id=[string]$node.Id;tag=$node.LocalName;expected=$node.absoluteBounds;actual="$($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)";maxDelta=$maxDelta};Write-Output "Container bounds changed $($node.LocalName) $($node.Id) $($node.absoluteBounds) -> $($bounds.X), $($bounds.Y), $($bounds.Width), $($bounds.Height)"};continue}
   $maxAll=[Math]::Max($maxAll,$maxDelta)
   if($maxDelta -gt 0.000000001){throw "Native geometry drift $($node.Id) $($node.LocalName) delta=$maxDelta"}
  }
  Write-Output "Geometry compared shapes=$geometryCount notInModel=$missing maxDelta=$maxAll"
 }
 $report=@{framework=[Environment]::Version.ToString();reload=[bool]$Reload;input=$InputDir;nativeCrcValid=$valid;calculatedCrc=$crc;loadMessages=$messages;counts=@{networks=$model.Networks.Count;variables=$model.Variables.Count;blocks=$blocks.Count;ports=$ports.Count;gvl=$gvl.Count;gvlFileCrcMismatch=$gvl.FileCrcMismatch};labels=$labels;geometryFrom=$GeometryFrom;geometryCompared=$geometryCount;geometryNotInModel=$missing;geometryMaxDelta=$maxAll;containerBoundsChanged=$containers;limits='Offline native serialization/CRC/decorator checks; not IDE Verify/Build, not target/project CRC.'}
 $report|ConvertTo-Json -Depth 6|Set-Content $ReportPath -Encoding UTF8
}finally{$transaction.Dispose();$store.Dispose()}
