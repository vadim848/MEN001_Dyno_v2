# Read-only isolated native safety-source predicate and filter enum probe.
# Run from repository root with Windows PowerShell 5.1; no project or hardware mutation.
$ErrorActionPreference='Stop'
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
$control=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesignerControl.dll'))
$ns='Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.AliasDeviceHandling.'
$standard=$control.GetType($ns+'StandardAliasDevice')
$device=[Activator]::CreateInstance($standard,@([int]1))
$flags=[Reflection.BindingFlags]'Instance,NonPublic,Public,Static'
$sds=Get-ChildItem 'MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/Alias Devices' -Recurse -Filter '*.sds'|Where-Object{(Get-Content $_.FullName -Raw) -match '<SDSID>54</SDSID>'}|Select-Object -First 1
[xml]$xml=Get-Content $sds.FullName -Raw
$device.Load([version]'1.9',$xml)
try{$types=$control.GetTypes()}catch [Reflection.ReflectionTypeLoadException]{$types=$_.Exception.Types};$verify=$types|Where-Object{$_ -and $_.Name -eq 'VerifierHSafetyPLC'}|Select-Object -First 1
$closure=$verify.GetNestedTypes($flags)|Where-Object{$_.Name -eq '<>c'}|Select-Object -First 1
$predicate=$closure.GetMethod('<VerifyPortHasOnlySafeIoMappings>b__49_0',$flags)
$singleton=$closure.GetField('<>9',$flags).GetValue($null)
$io=$device.IOs[0]
Write-Output "NativeSdsId=$($device.SdsId) IOCount=$($device.IOs.Count) SafetyType=$($io.SafetyType) IsUnsafe=$($predicate.Invoke($singleton,@($io.PSObject.BaseObject))) file=$($sds.FullName)"
$filterType=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortConnectableFilter]
foreach($v in [Enum]::GetValues($filterType)){Write-Output "Filter $([int]$v)=$v"}




