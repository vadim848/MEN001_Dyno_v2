param([switch]$Reload)
$ErrorActionPreference="Stop"
$base=$PSScriptRoot
$inputBase=(Resolve-Path "$base/../../../candidates/resumed-p0/staged").Path
$outputBase=(Resolve-Path "$base/../../../candidates/resumed-p0/native").Path
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
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$readBase=if($Reload){$outputBase}else{$inputBase}
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$tx=$store.TransactionManager.BeginTransaction('Isolated rebased P0 native preservation',$true)
try {
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $readBase 'TwinSafeGroup1.sal'),$partition,(Join-Path $readBase 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 foreach($m in $result){Write-Output "Load $($m.Kind): $($m.Message)"}
 if($result.Failed -or !$model){throw 'Native load failed'}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 if($model.Networks.Count -ne 14 -or $model.Variables.Count -ne 75 -or $blocks.Count -ne 241 -or $ports.Count -ne 2066){throw 'Native inventory changed'}
 $diagram=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model)|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){throw 'Native diagram missing'}
 $tx.Commit();$tx.Dispose()
 if(!$Reload){
  $tx=$store.TransactionManager.BeginTransaction('Fixup only eight new P0 wire presentations',$false)
  [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel]::EnableDiagramRules($store)
  $ledger=Get-Content "$base/../architect/P0_REBASE_LEDGER.json" -Raw|ConvertFrom-Json
  foreach($e in $ledger.wireDelta.addedWires){
   $wire=$store.ElementDirectory.FindElement([guid]$e.id)
   if(!$wire){throw "Missing added wire $($e.id)"}
   $n=$model.Networks|Where-Object{$_.Name -eq $e.from.Split('/')[2]}
   [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($n,$wire)
  }
  $tx.Commit()
  $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
  $helper.SaveModelAndDiagram($save,$model,(Join-Path $outputBase 'TwinSafeGroup1.sal'),$diagram,(Join-Path $outputBase 'TwinSafeGroup1.sal.diagram'),[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding,$false)
  foreach($m in $save){Write-Output "Save $($m.Kind): $($m.Message)"}
  if($save.Failed){throw 'Native save failed'}
 }elseif(!$valid){throw 'Fresh native SAL/diagram CRC invalid'}
 $stream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes((Join-Path $readBase 'GVL1.sgvl')))
 $gvl=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($stream)
 if($gvl.Count -ne 85){throw 'GVL inventory changed'}
 if(!$Reload){$saved=$gvl.SaveToMemoryStream();[IO.File]::WriteAllBytes((Join-Path $outputBase 'GVL1.sgvl'),$saved.ToArray())}elseif($gvl.FileCrcMismatch){throw 'Fresh native GVL CRC invalid'}
 $geometry=@();[xml]$inputDiagram=Get-Content (Join-Path $inputBase 'TwinSafeGroup1.sal.diagram') -Raw
 foreach($node in $inputDiagram.SelectNodes('//*[@absoluteBounds]')){
  $element=$store.ElementDirectory.FindElement([guid]$node.Id);if(!$element){throw "Lost shape $($node.Id)"}
  $v=$element.AbsoluteBounds;$actual=@($v.X,$v.Y,$v.Width,$v.Height);$expected=@($node.absoluteBounds.Split(',')|ForEach-Object{[double]::Parse($_,[Globalization.CultureInfo]::InvariantCulture)})
  for($i=0;$i -lt 4;$i++){if([Math]::Abs($actual[$i]-$expected[$i]) -gt 1e-9){throw "Geometry drift $($node.Id)"}}
  $geometry+=@{id=$node.Id;tag=$node.LocalName;bounds=$actual}
 }
 $report=@{reload=[bool]$Reload;inputCrcValid=$valid;blocks=$blocks.Count;ports=$ports.Count;symbols=$model.Variables.Count;gvl=$gvl.Count;gvlInputCrcMismatch=$gvl.FileCrcMismatch;preservedGeometry=$geometry.Count;limits='Offline native serialization/fresh CRC and inventory/geometry only; no IDE/Target or hardware validation'}
 $report|ConvertTo-Json -Depth 6|Set-Content (Join-Path $base $(if($Reload){'NATIVE_RELOAD.json'}else{'NATIVE_SAVE.json'}))
 Write-Output ($report|ConvertTo-Json -Compress)
}finally{$tx.Dispose();$store.Dispose()}
