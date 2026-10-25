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
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$readBase=if($Reload){$outputBase}else{$inputBase}
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$transaction=$store.TransactionManager.BeginTransaction('Authorized input representation repair offline native serialization',$true)
$assembly=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))
$flags=[Reflection.BindingFlags]'Public,NonPublic,Static,Instance,DeclaredOnly'
$types=$assembly.GetTypes()|Where-Object{$_.Name -match 'FbPortGlobalVariableReference|FunctionBlockPortHasFbPortGlobal|FunctionBlockPortBase|OutPort$|FBAnd$|VariableUsage|^WiredLink$'}
$results=@()
foreach($t in $types){$results+=@{type=$t.FullName;constructors=@($t.GetConstructors($flags)|ForEach-Object{$_.ToString()});properties=@($t.GetProperties($flags)|ForEach-Object{@{name=$_.Name;type=$_.PropertyType.FullName;write=$_.CanWrite}});methods=@($t.GetMethods($flags)|Where-Object{$_.Name -match 'Valid|Merge|Global|Accept|Count|Create|Output|Reference'}|ForEach-Object{$_.ToString()})}}
$results|ConvertTo-Json -Depth 6|Set-Content (Join-Path $PSScriptRoot 'NATIVE_MULTIGLOBAL_METADATA.json') -Encoding UTF8
$results|ForEach-Object{Write-Output ($_.type+' '+($_.methods -join '; '))}
