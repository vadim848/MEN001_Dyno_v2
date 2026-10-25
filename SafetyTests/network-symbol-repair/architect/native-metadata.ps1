param([string]$Pattern='Variable|WiredLink|Global|Network', [string]$Assembly='SALDesigner.dll')
Add-Type -TypeDefinition @"
using System;using System.IO;using System.Reflection.Metadata;using System.Reflection.PortableExecutable;using System.Text.RegularExpressions;
public class NativeMetadataList { public static void Run(string file,string pattern) {using var s=File.OpenRead(file);using var p=new PEReader(s);var r=p.GetMetadataReader();foreach(var h in r.TypeDefinitions){var t=r.GetTypeDefinition(h);var n=r.GetString(t.Name);if(!Regex.IsMatch(n,pattern))continue;Console.WriteLine("TYPE "+n);foreach(var mh in t.GetMethods()){var m=r.GetMethodDefinition(mh);Console.WriteLine("  "+r.GetString(m.Name));}}}}
"@
$taskOriginalWriter=[Console]::Out; $taskWriter=[System.IO.StringWriter]::new(); try {[Console]::SetOut($taskWriter); [NativeMetadataList]::Run("C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170\$Assembly",$Pattern)} finally {[Console]::SetOut($taskOriginalWriter)}; $taskWriter.ToString()

