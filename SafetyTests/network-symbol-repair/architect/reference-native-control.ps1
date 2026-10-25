param([string]$Mode='Generate')
$ErrorActionPreference='Stop'
$scriptBase=if($PSScriptRoot){$PSScriptRoot}else{Join-Path (Get-Location) 'SafetyTests/network-symbol-repair/editor'}
$nativeBase='C:/Users/user/source/repos/MEN001_Dyno/MEN001_Dyno/Safety_Dyno/TwinSafeGroup1'
$outBase=Join-Path $scriptBase 'control-output'
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
$salFile=Join-Path $nativeBase 'TwinSafeGroup1.sal'
$diagramFile=if($Mode -eq 'Existing'){Join-Path $nativeBase 'TwinSafeGroup1.sal.diagram'}else{Join-Path $outBase 'absent-input.sal.diagram'}
$transaction=$store.TransactionManager.BeginTransaction('Offline authorized symbol representation repair',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,$salFile,$partition,$diagramFile,$null,$validation,$null,[ref]$valid,[ref]$crc)
 Write-Output "Load: failed=$($result.Failed) nativeCrcValid=$valid calculated=$crc"
 foreach($message in $result){Write-Output "Serialization $($message.Kind): $($message.Message)"}
 if($result.Failed -or $null -eq $model){throw 'Native loading failed; no save'}
 Write-Output ('REFERENCE Networks='+$model.Networks.Count+' Variables='+$model.Variables.Count); foreach($v in $model.Variables){Write-Output ('Variable '+$v.Name)};
}finally{$transaction.Dispose();$store.Dispose()}

