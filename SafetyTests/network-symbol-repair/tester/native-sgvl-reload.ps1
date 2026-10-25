param([Parameter(Mandatory=$true)][string]$SgvlPath,[Parameter(Mandatory=$true)][string]$ResultPath)
$ErrorActionPreference='Stop'
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

[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
$before=(Get-FileHash -LiteralPath $SgvlPath -Algorithm SHA256).Hash.ToLower()
$stream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $SgvlPath).Path))
$list=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($stream)
$r=@{status=if(!$list.FileCrcMismatch -and $list.Count -eq 85){'PASS_NATIVE_SGVL_CRC'}else{'FAIL_NATIVE_SGVL_CRC_OR_COUNTS'};sha256=$before;count=$list.Count;fileCrcMismatch=$list.FileCrcMismatch;unchanged=((Get-FileHash -LiteralPath $SgvlPath -Algorithm SHA256).Hash.ToLower() -eq $before);scope='Read-only public CreateFromMemoryStream and FileCrcMismatch; no Save or CRC mutation.'}
$r|ConvertTo-Json|Set-Content -LiteralPath $ResultPath -Encoding UTF8
Write-Output ($r|ConvertTo-Json)
$stream.Dispose()
if($r.status -ne 'PASS_NATIVE_SGVL_CRC'){exit 1}
