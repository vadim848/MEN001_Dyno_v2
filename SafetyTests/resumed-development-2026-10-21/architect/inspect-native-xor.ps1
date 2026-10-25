$ErrorActionPreference='Stop'
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class XorArchitectureResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[XorArchitectureResolver]::Register($folders)
$assembly=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))
$types=@($assembly.GetTypes()|Where-Object{$_.Name -match 'Xor|Exclusive|Edge|Trigger'})
$result=@{assembly=$assembly.FullName;assemblyPath=$assembly.Location;assemblySha256=(Get-FileHash -LiteralPath $assembly.Location -Algorithm SHA256).Hash.ToLowerInvariant();matchingTypes=@($types|ForEach-Object{@{name=$_.FullName;base=$_.BaseType.FullName;properties=@($_.GetProperties()|ForEach-Object{@{name=$_.Name;type=$_.PropertyType.FullName}})}});claim='Type discovery only; no target resource/semantic support or native source-rule acceptance inferred'}
$result|ConvertTo-Json -Depth 7|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'NATIVE_XOR_DISCOVERY.json') -Encoding UTF8
$result|ConvertTo-Json -Depth 3
