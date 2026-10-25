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
 $transaction=$store.TransactionManager.BeginTransaction('Offline reload-only CRC observation',$true)
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Resolve-Path -LiteralPath $SalPath).Path,$partition,(Resolve-Path -LiteralPath $DiagramPath).Path,$null,$validation,$null,[ref]$valid,[ref]$crc)
 $report.nativeCrcValid=$valid;$report.nativeCalculatedCrc=$crc;$report.serializationFailed=$result.Failed
 $report.serializationMessages=@($result|ForEach-Object{[ordered]@{kind=[string]$_.Kind;message=[string]$_.Message}})
 if($model){
  $nativeBlocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks})
  $report.networks=$model.Networks.Count;$report.blocks=$nativeBlocks.Count;$report.symbols=$model.Variables.Count
  $report.inputPorts=(@($nativeBlocks|ForEach-Object{$_.InPorts})).Count;$report.outputPorts=(@($nativeBlocks|ForEach-Object{$_.OutPorts})).Count
  $categories=[Microsoft.VisualStudio.Modeling.Validation.ValidationCategories]0
  foreach($category in [Enum]::GetValues([Microsoft.VisualStudio.Modeling.Validation.ValidationCategories])){$categories=$categories -bor $category}
  $report.nativeValidationResult=$validation.Validate($store,$categories)
 }
 $report.validationErrors=@($validation.ErrorMessages|ForEach-Object{@{message=[string]$_.Description;code=[string]$_.Code}})
 $report.validationWarnings=@($validation.WarningMessages|ForEach-Object{@{message=[string]$_.Description;code=[string]$_.Code}})
 $report.status=if($valid -and !$result.Failed -and $model -and $report.validationErrors.Count -eq 0){'PASS'}else{'FAIL'}
 $transaction.Rollback()
}catch{
 $report.status='ERROR';$report.exception=$_.Exception.ToString();if($_.Exception.InnerException){$report.innerException=$_.Exception.InnerException.ToString()}
}finally{
 if($transaction){$transaction.Dispose()};if($store){$store.Dispose()}
 $report.salUnchanged=((Get-FileHash -LiteralPath $SalPath -Algorithm SHA256).Hash.ToLower() -eq $report.salSha256);$report.diagramUnchanged=((Get-FileHash -LiteralPath $DiagramPath -Algorithm SHA256).Hash.ToLower() -eq $report.diagramSha256)
 $report|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $ResultPath -Encoding UTF8
}
if($report.status -eq 'ERROR'){exit 3};if($report.status -ne 'PASS'){exit 1}
