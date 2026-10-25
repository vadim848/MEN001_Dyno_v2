param([switch]$Reload)
$ErrorActionPreference='Stop'
$base=if($PSScriptRoot){$PSScriptRoot}else{Join-Path (Get-Location) 'SafetyTests/safe-input-validation-repair/editor'}
$inputBase=Join-Path $base 'candidate-input'
$outputBase=Join-Path $base 'candidate-output'
[IO.Directory]::CreateDirectory($outputBase)|Out-Null
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class RepairNativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[RepairNativeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
Write-Output "Framework $([Environment]::Version); Apartment $([Threading.Thread]::CurrentThread.ApartmentState)"
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$readBase=if($Reload){$outputBase}else{$inputBase}
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$transaction=$store.TransactionManager.BeginTransaction('Authorized input representation repair offline native serialization',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $readBase 'TwinSafeGroup1.sal'),$partition,(Join-Path $readBase 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 Write-Output "Load failed=$($result.Failed) nativeCrcValid=$valid calculated=$crc"
 foreach($message in $result){Write-Output "Serialization $($message.Kind): $($message.Message)"}
 if($result.Failed -or !$model){throw 'Native load failed'}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 Write-Output "Counts networks=$($model.Networks.Count) symbols=$($model.Variables.Count) blocks=$($blocks.Count) ports=$($ports.Count)"
 if($model.Networks.Count -ne 14 -or $model.Variables.Count -ne 75 -or $blocks.Count -ne 254 -or $ports.Count -ne 2172){throw 'Native counts changed'}
 $diagram=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){throw 'Existing diagram missing; regeneration prohibited'}
 $labels=@()
 $plan=Get-Content (Join-Path $base '../../network-symbol-repair/architect/SYMBOL_PLAN.json') -Raw|ConvertFrom-Json
 $targets=@()
 foreach($entry in $plan.plan){foreach($target in $entry.targets){$targets+=@{target=$target;expected=$entry.symbolName}}}
 foreach($target in @('//Network1/FBAndUnlockHold/AndIn1','//Network1/FBAndLvCurrentPermit/AndIn1','//RndPhysicalCompact/GATE_001/AndIn1')){$targets+=@{target=$target;expected='in_Estop_PLC'}}
 $targets+=@{target='//RndPhysicalCompact/GATE_001/AndIn4';expected='linkSafeMode'}
 foreach($entry in $targets){
  $target=$entry.target
  if($target -eq '//RndPhysicalCompact/GATE_001/AndIn1' -and $entry.expected -eq 'linkSafeMode'){$target='//RndPhysicalCompact/GATE_001/AndIn4'}
  $parts=$target.Split('/');$n=$model.Networks|Where-Object{$_.Name -eq $parts[2]};$b=$n.FunctionBlocks|Where-Object{$_.Name -eq $parts[3]};$p=$b.InPorts|Where-Object{$_.Name -eq $parts[4]}
  $shape=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($p)|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.InPortShape]}|Select-Object -First 1
  if(!$shape){throw "Missing port shape $target"}
  $decorator=$shape.AssignedVariableDecorator
  $label=@{target=$target;expected=$entry.expected;text=$decorator.Field.GetDisplayText($shape);visible=$decorator.GetVisible($shape);fieldVisible=$decorator.Field.GetVisible($shape);bounds=$shape.AbsoluteBounds.ToString()}
  $labels+=$label
  if($label.text -ne $label.expected -or !$label.visible -or !$label.fieldVisible){throw "Native label mismatch $target expected=$($label.expected) got=$($label.text) visible=$($label.visible)/$($label.fieldVisible)"}
 }
 Write-Output "Native labels passed count=$($labels.Count) (24 previous + 4 affected targets)"
 $transaction.Commit()
 if(!$Reload){
  $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
  $encoding=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding
  $helper.SaveModelAndDiagram($save,$model,(Join-Path $outputBase 'TwinSafeGroup1.sal'),$diagram,(Join-Path $outputBase 'TwinSafeGroup1.sal.diagram'),$encoding,$false)
  Write-Output "Native save failed=$($save.Failed)"
  foreach($message in $save){Write-Output "Save $($message.Kind): $($message.Message)"}
  if($save.Failed){throw 'Native save failed'}
 }elseif(!$valid){throw 'Fresh native SAL/diagram CRC invalid'}
 $stream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes((Join-Path $readBase 'GVL1.sgvl')))
 $gvl=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($stream)
 Write-Output "SGVL count=$($gvl.Count) FileCrcMismatch=$($gvl.FileCrcMismatch)"
 if($gvl.Count -ne 85){throw 'SGVL definitions lost'}
 if(!$Reload){$saved=$gvl.SaveToMemoryStream();[IO.File]::WriteAllBytes((Join-Path $outputBase 'GVL1.sgvl'),$saved.ToArray())}elseif($gvl.FileCrcMismatch){throw 'Fresh native SGVL CRC invalid'}
 $geometry=@()
 if($Reload){
  [xml]$stagedDiagram=Get-Content (Join-Path $inputBase 'TwinSafeGroup1.sal.diagram') -Raw
  foreach($node in $stagedDiagram.SelectNodes('//*[@absoluteBounds]')){
   $element=$store.ElementDirectory.FindElement([guid]$node.Id)
   if(!$element){throw "Missing native shape $($node.Id)"}
   $bounds=$element.AbsoluteBounds;$expected=@($node.absoluteBounds.Split(',')|ForEach-Object{[double]::Parse($_,[Globalization.CultureInfo]::InvariantCulture)})
   $actual=@($bounds.X,$bounds.Y,$bounds.Width,$bounds.Height);$maxDelta=0.0
   for($i=0;$i -lt 4;$i++){$maxDelta=[Math]::Max($maxDelta,[Math]::Abs($expected[$i]-$actual[$i]))}
   $geometry+=@{id=[string]$node.Id;tag=$node.LocalName;expected=@($expected);actual=@($actual);maxDelta=$maxDelta}
   if($maxDelta -gt 0.000000001){throw "Native geometry drift $($node.Id) delta=$maxDelta"}
  }
  Write-Output "Fresh native geometry agrees with all $($geometry.Count) staged shape bounds within1e-9"
 }
 $report=@{framework=[Environment]::Version.ToString();reload=[bool]$Reload;nativeCrcValid=$valid;counts=@{networks=$model.Networks.Count;symbols=$model.Variables.Count;blocks=$blocks.Count;ports=$ports.Count;gvl=$gvl.Count};labels=$labels;geometry=$geometry;limits='Offline native serialization/CRC and decorator checks, not full IDE Verify/Build or target validation.'}
 $report|ConvertTo-Json -Depth 6|Set-Content (Join-Path $base $(if($Reload){'NATIVE_FRESH_RELOAD.json'}else{'NATIVE_SAVE.json'})) -Encoding UTF8
}finally{$transaction.Dispose();$store.Dispose()}
