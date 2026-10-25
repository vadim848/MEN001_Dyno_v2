$ErrorActionPreference='Stop'
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class ProbeResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[ProbeResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
$control=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesignerControl.dll'))
$flags=[Reflection.BindingFlags]'Instance,NonPublic,Public,Static,DeclaredOnly'
$t=$control.GetType('Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.AliasDeviceHandling.StandardAliasDevice')
$t.BaseType.FullName
$control=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesignerControl.dll'))
$std=$control.GetType('Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.AliasDeviceHandling.StandardAliasDevice')
function New-SdsXml([string]$srcFile,[int]$newId){
 [xml]$x=Get-Content -LiteralPath $srcFile -Raw
 if($newId -gt 0){$x.SafetyDeviceDesc.SDSID=[string]$newId}
 $dev=[Activator]::CreateInstance($std,@([int]$x.SafetyDeviceDesc.AliasDeviceType.SubType))
 $dev.Load([version]$x.SafetyDeviceDesc.FileFormatVersion,$x)

 return $dev.ToXml()
}
