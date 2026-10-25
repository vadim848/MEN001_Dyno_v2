$ErrorActionPreference='Stop'
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class ArchitectureNativeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[ArchitectureNativeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
Write-Output "Framework $([Environment]::Version); Apartment $([Threading.Thread]::CurrentThread.ApartmentState)"
$base=Join-Path $PSScriptRoot 'probes/multiple-global'
[IO.Directory]::CreateDirectory($base)|Out-Null
$inputRoot=Join-Path (Get-Location) 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1'
$domain=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$domain)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$tx=$store.TransactionManager.BeginTransaction('Read-only canonical; isolated native relationship capacity probe',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $inputRoot 'TwinSafeGroup1.sal'),$partition,(Join-Path $inputRoot 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 if($result.Failed -or !$model){throw 'Model load failure'}
 $tx.Commit();$tx.Dispose()
 $categories=[Microsoft.VisualStudio.Modeling.Validation.ValidationCategories]0; foreach($c in [Enum]::GetValues([Microsoft.VisualStudio.Modeling.Validation.ValidationCategories])){$categories=$categories -bor $c}; $baselineValid=$validation.Validate($store,$categories)
 $baselineErrors=@($validation.ErrorMessages|ForEach-Object{$_.Description})
 $network=$model.Networks|Where-Object{$_.Name -eq 'Network2'}
 $block=$network.FunctionBlocks|Where-Object{$_.Name -eq 'FBAnd12'}
 $newPort=$block.OutPorts|Where-Object{$_.Name -eq 'AndOut'}
 $relay=$network.FunctionBlocks|Where-Object{$_.Name -eq 'FBDecouple1'}
 $sources=@($relay.OutPorts|Where-Object{$_.Name -in @('DecOut1','DecOut2')})
 $refs=@($sources|ForEach-Object{[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortHasFbPortGlobalVariableReferences]::GetFbPortGlobalVariableReferences($_)})
 if($refs.Count -ne 2){throw "Unexpected source ref count $($refs.Count)"}
 $tx=$store.TransactionManager.BeginTransaction('Isolated two global writer references capacity probe',$true)
 foreach($r in $refs){$r.FunctionBlockPort=$newPort}
 $tx.Commit();$tx.Dispose()
 $moved=@([BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortHasFbPortGlobalVariableReferences]::GetFbPortGlobalVariableReferences($newPort))
 $validationAfter=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
 $afterValid=$validationAfter.Validate($store,$categories)
 $afterErrors=@($validationAfter.ErrorMessages|ForEach-Object{$_.Description})
 $diagram=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
 $helper.SaveModelAndDiagram($save,$model,(Join-Path $base 'TwinSafeGroup1.sal'),$diagram,(Join-Path $base 'TwinSafeGroup1.sal.diagram'),[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding,$false)
 $report=@{scope='Isolated native API cardinality/serialization probe only; not candidate logic/native timing/target proof';canonicalChanged=$false;baselineCrcValid=$valid;baselineValid=$baselineValid;baselineErrors=$baselineErrors;twoReferencesAtNewPort=$moved.Count;afterValid=$afterValid;afterErrors=$afterErrors;newErrors=@($afterErrors|Where-Object{$_ -notin $baselineErrors});saveFailed=$save.Failed;refIds=@($moved|ForEach-Object{$_.Id.ToString()});portId=$newPort.Id.ToString()}
 $report|ConvertTo-Json -Depth 5|Set-Content (Join-Path $base 'RESULT.json') -Encoding UTF8
 $report|ConvertTo-Json -Depth 4
 $freshStore=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$domain)
 $freshPartition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $freshStore
 $freshResult=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
 $freshTx=$freshStore.TransactionManager.BeginTransaction('Independent store reload capacity probe',$true)
 try{
  $freshValid=$false;$freshCrc=[uint32]0
  $freshModel=$helper.LoadModelAndDiagram($freshResult,$freshStore.DefaultPartition,(Join-Path $base 'TwinSafeGroup1.sal'),$freshPartition,(Join-Path $base 'TwinSafeGroup1.sal.diagram'),$null,$null,$null,[ref]$freshValid,[ref]$freshCrc)
  $freshPort=@($freshModel.Networks|ForEach-Object{$_.FunctionBlocks}|ForEach-Object{$_.OutPorts})|Where-Object{$_.Id.ToString() -eq $report.portId}
  $freshRefs=@([BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortHasFbPortGlobalVariableReferences]::GetFbPortGlobalVariableReferences($freshPort))
  $freshTx.Commit()
  $report.freshReload=@{failed=$freshResult.Failed;crcValid=$freshValid;refCount=$freshRefs.Count;refIds=@($freshRefs|ForEach-Object{$_.Id.ToString()});blocks=@($freshModel.Networks|ForEach-Object{$_.FunctionBlocks}).Count;symbols=$freshModel.Variables.Count}
 }finally{$freshTx.Dispose();$freshStore.Dispose()}
 $report|ConvertTo-Json -Depth 5|Set-Content (Join-Path $base 'RESULT.json') -Encoding UTF8
 Write-Output ('FreshReload '+($report.freshReload|ConvertTo-Json -Compress))
}finally{if($tx){$tx.Dispose()};$store.Dispose()}


