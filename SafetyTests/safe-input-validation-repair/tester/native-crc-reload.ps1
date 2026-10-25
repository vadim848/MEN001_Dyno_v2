param([Parameter(Mandatory=$true)][string]$SalPath,[Parameter(Mandatory=$true)][string]$DiagramPath,[Parameter(Mandatory=$true)][string]$ResultPath)
$ErrorActionPreference='Stop'
if(!(Test-Path -LiteralPath $SalPath -PathType Leaf) -or !(Test-Path -LiteralPath $DiagramPath -PathType Leaf)){throw 'Reload-only requires existing SAL and diagram; generation prohibited in tester host'}
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class IndependentNativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[IndependentNativeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
$report=[ordered]@{timeUtc=[DateTime]::UtcNow.ToString('o');framework=[Environment]::Version.ToString();apartment=[Threading.Thread]::CurrentThread.ApartmentState.ToString();sal=(Resolve-Path -LiteralPath $SalPath).Path;diagram=(Resolve-Path -LiteralPath $DiagramPath).Path;salSha256=(Get-FileHash -LiteralPath $SalPath -Algorithm SHA256).Hash.ToLower();diagramSha256=(Get-FileHash -LiteralPath $DiagramPath -Algorithm SHA256).Hash.ToLower();status='ERROR';nativeCrcValid=$null;serializationFailed=$null;serializationMessages=@();validationErrors=@();validationWarnings=@();exception=$null;scope='Fresh native LoadModelAndDiagram with real validation controller. No Save, CRC editing, rule suppression, equipment or build. CRC observation alone never means complete acceptance.'}
$store=$null;$transaction=$null
try{
 $domainTypes=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
 $store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$domainTypes)
 $partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
 $result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
 $validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
 $helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
 $transaction=$store.TransactionManager.BeginTransaction('Independent offline reload-only CRC observation',$true)
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Resolve-Path -LiteralPath $SalPath).Path,$partition,(Resolve-Path -LiteralPath $DiagramPath).Path,$null,$validation,$null,[ref]$valid,[ref]$crc)
 $report.nativeCrcValid=$valid;$report.nativeCalculatedCrc=$crc;$report.serializationFailed=$result.Failed
 $report.serializationMessages=@($result|ForEach-Object{[ordered]@{kind=[string]$_.Kind;message=[string]$_.Message}})
 $report.validationErrors=@($validation.ErrorMessages|ForEach-Object{[ordered]@{message=[string]$_.Description;code=[string]$_.Code;objectType=$_.GetType().FullName}})
 $report.validationWarnings=@($validation.WarningMessages|ForEach-Object{[ordered]@{message=[string]$_.Description;code=[string]$_.Code;objectType=$_.GetType().FullName}})
 if($model){
  $nativeBlocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks})
  $report.networks=$model.Networks.Count;$report.blocks=$nativeBlocks.Count;$report.symbols=$model.Variables.Count
  $report.inputPorts=(@($nativeBlocks|ForEach-Object{$_.InPorts})).Count;$report.outputPorts=(@($nativeBlocks|ForEach-Object{$_.OutPorts})).Count
  $report.expectedCountsPreserved=($report.networks -eq 14 -and $report.blocks -eq 254 -and $report.symbols -eq 75 -and ($report.inputPorts+$report.outputPorts) -eq 2172)
  [xml]$baselineDiagram=Get-Content 'SafetyTests/network-symbol-repair/editor/native-reviewed-output/TwinSafeGroup1.sal.diagram' -Raw
  $report.baselineGeometry=@();$nonzeroGeometry=0
  foreach($node in $baselineDiagram.SelectNodes('//*[@absoluteBounds]')){
   $element=$store.ElementDirectory.FindElement([guid]$node.Id)
   if(!$element){throw "Missing baseline shape identity $($node.Id)"}
   $bounds=$element.AbsoluteBounds;$expected=@($node.absoluteBounds.Split(',')|ForEach-Object{[double]::Parse($_,[Globalization.CultureInfo]::InvariantCulture)})
   $actual=@($bounds.X,$bounds.Y,$bounds.Width,$bounds.Height);$delta=0.0
   for($i=0;$i -lt 4;$i++){$delta=[Math]::Max($delta,[Math]::Abs($expected[$i]-$actual[$i]))}
   if(($actual|Where-Object{[Math]::Abs($_) -gt 0.000000001}).Count){$nonzeroGeometry++}
   if($delta -gt 0.000000001){throw "Actual native baseline geometry changed $($node.Id): $delta"}
   $report.baselineGeometry+=@{id=[string]$node.Id;tag=[string]$node.LocalName;expected=$expected;actual=$actual;maxDelta=$delta}
  }
  $report.nonzeroNativeGeometryCount=$nonzeroGeometry
  if($report.baselineGeometry.Count -ne 2463 -or $nonzeroGeometry -ne 2463){throw 'Complete nonzero native shape geometry coverage missing'}
 }
 if($model -and $report.expectedCountsPreserved){
  $plan=Get-Content 'SafetyTests/network-symbol-repair/architect/SYMBOL_PLAN.json' -Raw|ConvertFrom-Json
    $move=@{'//Network1/FBAndUnlockHold/AndIn1'='//Network1/FBAndUnlockHold/AndIn5';'//Network1/FBAndLvCurrentPermit/AndIn1'='//Network1/FBAndLvCurrentPermit/AndIn8';'//RndPhysicalCompact/GATE_001/AndIn1'='//RndPhysicalCompact/GATE_001/AndIn4'}
  foreach($entry in $plan.plan){$entry.targets=@($entry.targets|ForEach-Object{if($move.ContainsKey($_)){$move[$_]}else{$_}})}
  $plan.plan+=@(@{symbolName='in_Estop_PLC';targets=@('//Network1/FBAndUnlockHold/AndIn1','//Network1/FBAndLvCurrentPermit/AndIn1','//RndPhysicalCompact/GATE_001/AndIn1')},@{symbolName='GVL1.b_EStop_Ok';targets=@('//Network1/FBAndLvCurrentPermit/AndIn8')})
  $report.symbolLabels=@()
  foreach($entry in $plan.plan){foreach($target in $entry.targets){
   $parts=$target.Split('/');$n=$model.Networks|Where-Object {$_.Name -eq $parts[2]};$b=$n.FunctionBlocks|Where-Object {$_.Name -eq $parts[3]};$p=$b.InPorts|Where-Object {$_.Name -eq $parts[4]}
   $shapes=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($p)|Where-Object {$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.InPortShape]})
   if($shapes.Count -ne 1){throw "Required unique symbol target shape missing: $target"}
   $shape=$shapes[0];$decorator=$shape.AssignedVariableDecorator
   $report.symbolLabels+=@{target=$target;expected=$entry.symbolName;portId=$p.Id.ToString();shapeId=$shape.Id.ToString();text=$decorator.Field.GetDisplayText($shape);decoratorVisible=$decorator.GetVisible($shape);fieldVisible=$decorator.Field.GetVisible($shape)}
  }}
  $report.symbolLabelsPassed=($report.symbolLabels.Count -eq 28 -and @($report.symbolLabels|Where-Object {$_.text -ne $_.expected -or !$_.decoratorVisible -or !$_.fieldVisible}).Count -eq 0)
  $categories=[Microsoft.VisualStudio.Modeling.Validation.ValidationCategories]0
  foreach($category in [Enum]::GetValues([Microsoft.VisualStudio.Modeling.Validation.ValidationCategories])){$categories=$categories -bor $category}
  $report.nativeValidationResult=$validation.Validate($store,$categories)
  $report.validationErrors=@($validation.ErrorMessages|ForEach-Object{@{message=[string]$_.Description;code=[string]$_.Code}})
  $report.validationWarnings=@($validation.WarningMessages|ForEach-Object{@{message=[string]$_.Description;code=[string]$_.Code}})
 }
 $report.status=if($valid -and !$result.Failed -and $model -and $report.expectedCountsPreserved -and $report.symbolLabelsPassed -and $report.validationErrors.Count -eq 0){'PASS_NATIVE_RELOAD_CRC_AND_COUNTS'}else{'FAIL_NATIVE_RELOAD_CRC_OR_COUNTS'}
 $transaction.Rollback()
}catch{
 $report.exception=$_.Exception.ToString();if($_.Exception.InnerException){$report.innerException=$_.Exception.InnerException.ToString()};Write-Output $report.exception
}finally{
 if($transaction){$transaction.Dispose()};if($store){$store.Dispose()}
 $report.salUnchanged=((Get-FileHash -LiteralPath $SalPath -Algorithm SHA256).Hash.ToLower() -eq $report.salSha256);$report.diagramUnchanged=((Get-FileHash -LiteralPath $DiagramPath -Algorithm SHA256).Hash.ToLower() -eq $report.diagramSha256)
 $report|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $ResultPath -Encoding UTF8
 Write-Output ($report|ConvertTo-Json -Depth 10)
}
if($report.status -eq 'ERROR'){exit 3};if($report.status -ne 'PASS_NATIVE_RELOAD_CRC_AND_COUNTS'){exit 1}

