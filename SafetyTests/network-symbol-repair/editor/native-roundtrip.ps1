param([string]$Mode='Generate')
$ErrorActionPreference='Stop'
$scriptBase=if($PSScriptRoot){$PSScriptRoot}else{Join-Path (Get-Location) 'SafetyTests/network-symbol-repair/editor'}
$nativeBase=Join-Path $scriptBase 'native-solution/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1'
$outBase=Join-Path $scriptBase 'native-output'
[IO.Directory]::CreateDirectory($outBase)|Out-Null
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class NativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[NativeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
Write-Output "Framework $([Environment]::Version); Apartment $([Threading.Thread]::CurrentThread.ApartmentState)"
$domainTypes=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$domainTypes)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$salFile=if($Mode -eq 'Reload'){Join-Path $outBase 'TwinSafeGroup1.sal'}else{Join-Path $nativeBase 'TwinSafeGroup1.sal'}
$diagramFile=if($Mode -eq 'Reload'){Join-Path $outBase 'TwinSafeGroup1.sal.diagram'}elseif($Mode -eq 'Existing'){Join-Path $nativeBase 'TwinSafeGroup1.sal.diagram'}else{Join-Path $outBase 'absent-input.sal.diagram'}
$transaction=$store.TransactionManager.BeginTransaction('Offline authorized symbol representation repair',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,$salFile,$partition,$diagramFile,$null,$validation,$null,[ref]$valid,[ref]$crc)
 Write-Output "Load: failed=$($result.Failed) nativeCrcValid=$valid calculated=$crc"
 foreach($message in $result){Write-Output "Serialization $($message.Kind): $($message.Message) [Line=$($message.Line), Column=$($message.Column), LineNumber=$($message.LineNumber), Position=$($message.LinePosition)]"}
 if($result.Failed -or $null -eq $model){throw 'Native loading failed; no save'}
 $diagrams=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))
 Write-Output "Root presentations: $($diagrams.Count)"
 foreach($d in $diagrams){Write-Output "Presentation $($d.GetType().FullName)"}
 $diagram=$diagrams|Where-Object {$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if($null -eq $diagram){throw 'Native diagram missing'}
 Write-Output "Networks=$($model.Networks.Count); Variables=$($model.Variables.Count); native diagram child shapes=$($diagram.NestedChildShapes.Count)"
 if($Mode -eq 'Reload'){
  $blocks=@($model.Networks|ForEach-Object {$_.FunctionBlocks});$portCount=0;foreach($block in $blocks){$portCount+=$block.InPorts.Count+$block.OutPorts.Count}
  Write-Output "Fresh native counts: networks=$($model.Networks.Count) variables=$($model.Variables.Count) blocks=$($blocks.Count) ports=$portCount"
  $manifest=Get-Content (Join-Path $scriptBase '../architect/SYMBOL_PLAN.json') -Raw|ConvertFrom-Json
  $labels=@()
  foreach($entry in $manifest.plan){foreach($target in $entry.targets){
   $parts=$target.Split('/')
   $network=$model.Networks|Where-Object {$_.Name -eq $parts[2]}
   $block=$network.FunctionBlocks|Where-Object {$_.Name -eq $parts[3]}
   $port=$block.InPorts|Where-Object {$_.Name -eq $parts[4]}
   $shape=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($port)|Where-Object {$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.InPortShape]}|Select-Object -First 1
   $decorator=$shape.AssignedVariableDecorator
   $labels+=[pscustomobject]@{Target=$target;Expected=$entry.symbolName;ShapeId=$shape.Id.ToString();DecoratorVisible=$decorator.GetVisible($shape);FieldVisible=$decorator.Field.GetVisible($shape);Text=$decorator.Field.GetDisplayText($shape)}
  }}
  $labels|ConvertTo-Json -Depth 4|Set-Content (Join-Path $scriptBase 'NATIVE_SYMBOL_LABELS.json')
  foreach($label in $labels){Write-Output "Native symbol label: $($label.Target) expected=$($label.Expected) text=$($label.Text) visible=$($label.DecoratorVisible)/$($label.FieldVisible)"}
  Write-Output "Validation categories: $([Enum]::GetNames([Microsoft.VisualStudio.Modeling.Validation.ValidationCategories])-join ',')"
  $categories=[Microsoft.VisualStudio.Modeling.Validation.ValidationCategories]0
  foreach($category in [Enum]::GetValues([Microsoft.VisualStudio.Modeling.Validation.ValidationCategories])){$categories=$categories -bor $category}
  $validated=$validation.Validate($store,$categories)
  Write-Output "Validation result=$validated errors=$($validation.ErrorMessages.Count) warnings=$($validation.WarningMessages.Count)"
  foreach($message in $validation.ErrorMessages){Write-Output "Native validation ERROR: $($message.Description) $($message.Code)"}
  foreach($message in $validation.WarningMessages){Write-Output "Native validation WARNING: $($message.Description) $($message.Code)"}
  $transaction.Commit()
  if(-not $valid){throw 'Fresh native model+diagram CRC is invalid'}
  return
 }
 $transaction.Commit()
 $transaction.Dispose()
 $transaction=$store.TransactionManager.BeginTransaction('Native diagram fixup',$false)
 [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel]::EnableDiagramRules($store)
 $orderedNetworks=@($model.Networks|Sort-Object NetworkOrderId)
 foreach($network in $orderedNetworks){
  [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($model,$network)
  foreach($block in $network.FunctionBlocks){
   [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($network,$block)
   foreach($port in @($block.InPorts)+@($block.OutPorts)+@($block.ParameterPorts)){if($null -ne $port){[Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($block,$port)}}
  }
 }
 foreach($network in $orderedNetworks){foreach($block in $network.FunctionBlocks){foreach($port in @($block.InPorts)+@($block.OutPorts)){
  foreach($wire in [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.WiredLink]::GetLinksToTargetFunctionBlockPorts($port)){
   [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($network,$wire)
  }
 }}}
 Write-Output "After FixUpDiagram: native diagram child shapes=$($diagram.NestedChildShapes.Count)"
 $transaction.Commit()
 $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
 $encoding=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding
 $helper.SaveModelAndDiagram($save,$model,(Join-Path $outBase 'TwinSafeGroup1.sal'),$diagram,(Join-Path $outBase 'TwinSafeGroup1.sal.diagram'),$encoding,$false)
 Write-Output "Save: failed=$($save.Failed) encoding=$($encoding.WebName)"
 foreach($message in $save){Write-Output "Serialization $($message.Kind): $($message.Message)"}
 if($save.Failed){throw 'Native save failed'}
 [Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
 $gvlInput=Join-Path $scriptBase 'candidate-native-bindings/GVL1.sgvl'
 $gvlStream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes($gvlInput))
 $globalList=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($gvlStream)
 Write-Output "SGVL initial count=$($globalList.Count) FileCrcMismatch=$($globalList.FileCrcMismatch)"
 $globalSaved=$globalList.SaveToMemoryStream()
 [IO.File]::WriteAllBytes((Join-Path $outBase 'GVL1.sgvl'),$globalSaved.ToArray())
 $globalFreshStream=New-Object IO.MemoryStream -ArgumentList (,$globalSaved.ToArray())
 $globalFresh=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($globalFreshStream)
 Write-Output "SGVL fresh count=$($globalFresh.Count) FileCrcMismatch=$($globalFresh.FileCrcMismatch)"
 if($globalFresh.FileCrcMismatch){throw 'Native SGVL CRC failed'}
}catch{
 Write-Output $_.Exception.ToString()
 if($_.Exception.InnerException){Write-Output $_.Exception.InnerException.ToString()}
 throw
}finally{
 $transaction.Dispose();$store.Dispose()
}
