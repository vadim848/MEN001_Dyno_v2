# Native splcproj Project Crc: verify and (optionally) rewrite via Beckhoff ProjectFileCrcWriter. No hand computation.
# Usage: project-crc.ps1 -Splcproj <in> [-OutPath <out>]   (verify only if no -OutPath; never overwrites input)
param([Parameter(Mandatory=$true)][string]$Splcproj,[string]$OutPath)
$ErrorActionPreference='Stop'
$d='C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16'
$folders=@("$d\v170","$d\Common",'C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition 'using System;using System.IO;using System.Reflection;public static class PcR{public static string[] F;public static void Reg(string[] f){F=f;AppDomain.CurrentDomain.AssemblyResolve+=Res;}static Assembly Res(object s,ResolveEventArgs e){string n=new AssemblyName(e.Name).Name+".dll";foreach(string f in F){string p=Path.Combine(f,n);if(File.Exists(p))return Assembly.LoadFrom(p);}return null;}}'
[PcR]::Reg($folders)
$asm=[Reflection.Assembly]::LoadFrom("$d\v170\SALDesignerControl.dll")
$ns='Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.UInt32BasedSerialization.'
$ver=$asm.GetType($ns+'ProjectFileCrcVerifier'); $wr=$asm.GetType($ns+'ProjectFileCrcWriter')
function Load($p){$x=New-Object Xml.XmlDocument;$x.Load((Resolve-Path -LiteralPath $p).Path);$x}
function Verify($x){$v=[Activator]::CreateInstance($ver);$m=$ver.GetMethod('Verify',[Type[]]@([Xml.XmlDocument]));[bool]$m.Invoke($v,[object[]]@([Xml.XmlDocument]$x.PSObject.BaseObject))}
$x=Load $Splcproj
"file Crc attr: $($x.DocumentElement.GetAttribute('Crc')); verifyOK(input)=$(Verify $x)"
if($OutPath){
 $x.DocumentElement.RemoveAttribute('Crc')
 $ms=New-Object IO.MemoryStream
 $w=[Activator]::CreateInstance($wr,[object[]]@([IO.MemoryStream]$ms))
 $w.CrcSettings.ThrowExceptionOnMissingPrecalculatedCrc=$false
 $x.Save($w);$w.Flush();$ms.Flush()
 "missing precalculated crcs: $(@($w.GetReportedMissingPrecalculatedCrcs()).Count)"
 $w.Dispose()
 [IO.File]::WriteAllBytes($OutPath,$ms.ToArray())
 $y=Load $OutPath; "out Crc attr: $($y.DocumentElement.GetAttribute('Crc')); verifyOK(out)=$(Verify $y)"
}
