param([Parameter(Mandatory)][string]$Dir,[Parameter(Mandatory)][string]$AliasDir,[Parameter(Mandatory)][string]$ResultPath,[int]$ExpectBlocks=242,[int]$ExpectPorts=2076)
# Independent tester E1-f1: read-only fresh native reload (SAL+diagram+SGVL CRC, inventory, geometry)
# and safe-only source sub-rule on ALL standard-alias-sourced Symbols. Dir holds the three native files
# (an isolated copy). Nothing is saved. Windows PowerShell 5.1. No project/hardware/target operation.
$ErrorActionPreference='Stop'
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class E1F1Resolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[E1F1Resolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
$control=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesignerControl.dll'))
$flags=[Reflection.BindingFlags]'Instance,NonPublic,Public,Static'
try{$ctypes=$control.GetTypes()}catch [Reflection.ReflectionTypeLoadException]{$ctypes=$_.Exception.Types}
$verify=$ctypes|Where-Object{$_ -and $_.Name -eq 'VerifierHSafetyPLC'}|Select-Object -First 1
$closure=$verify.GetNestedTypes($flags)|Where-Object{$_.Name -eq '<>c'}|Select-Object -First 1
$predicate=$closure.GetMethod('<VerifyPortHasOnlySafeIoMappings>b__49_0',$flags)
$singleton=$closure.GetField('<>9',$flags).GetValue($null)
$standardType=$control.GetType('Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.AliasDeviceHandling.StandardAliasDevice')
# Standard alias devices (read-only SDS files): native StandardAliasDevice load + actual native unsafe predicate
$standard=@{}
foreach($f in Get-ChildItem -LiteralPath $AliasDir -Recurse -Filter '*.sds'){
 [xml]$x=Get-Content -LiteralPath $f.FullName -Raw
 if($x.SafetyDeviceDesc.StandardAliasDevice){
  $dev=[Activator]::CreateInstance($standardType,@([int]$x.SafetyDeviceDesc.AliasDeviceType.SubType));$dev.Load([version]$x.SafetyDeviceDesc.FileFormatVersion,$x)
  $io=$dev.IOs[0];$unsafe=[bool]$predicate.Invoke($singleton,@($io.PSObject.BaseObject))
  $standard[[string]$dev.SdsId]=@{file=$f.FullName.Substring($AliasDir.Length);safetyType=[string]$io.SafetyType;nativeUnsafe=$unsafe;sha256=(Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLower()}
 }
}
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$sal=Join-Path $Dir 'TwinSafeGroup1.sal';$dia=Join-Path $Dir 'TwinSafeGroup1.sal.diagram';$gvlPath=Join-Path $Dir 'GVL1.sgvl'
$hashes=@{sal=(Get-FileHash -LiteralPath $sal -Algorithm SHA256).Hash.ToLower();diagram=(Get-FileHash -LiteralPath $dia -Algorithm SHA256).Hash.ToLower();sgvl=(Get-FileHash -LiteralPath $gvlPath -Algorithm SHA256).Hash.ToLower()}
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$tx=$store.TransactionManager.BeginTransaction('E1-f1 read-only native reload',$true)
$errors=@();$messages=@()
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,$sal,$partition,$dia,$null,$validation,$null,[ref]$valid,[ref]$crc)
 foreach($m in $result){$messages+="$($m.Kind): $($m.Message)"}
 if($result.Failed -or !$model){throw 'Native load failed'}
 if(!$valid){$errors+='Fresh native SAL/diagram CRC invalid'}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 $counts=[ordered]@{networks=$model.Networks.Count;blocks=$blocks.Count;ports=$ports.Count;symbols=$model.Variables.Count}
 if($counts.networks -ne 14 -or $counts.blocks -ne $ExpectBlocks -or $counts.ports -ne $ExpectPorts -or $counts.symbols -ne 75){$errors+="Native inventory $($counts|ConvertTo-Json -Compress)"}
 $diagram=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model)|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){$errors+='Native diagram missing'}
 $stream=New-Object IO.MemoryStream -ArgumentList (,[IO.File]::ReadAllBytes($gvlPath))
 $gvl=[Beckhoff.TwinCAT.XAE.Vsx.TwinSafe.Variables.GVL.GlobalVariableList]::CreateFromMemoryStream($stream)
 if($gvl.Count -ne 85){$errors+='GVL inventory'};if($gvl.FileCrcMismatch){$errors+='Fresh native GVL CRC mismatch'}
 # geometry: every serialized shape is loaded natively at exactly its serialized bounds
 [xml]$dx=Get-Content -LiteralPath $dia -Raw;$geometry=0;$drift=@()
 foreach($node in $dx.SelectNodes('//*[@absoluteBounds]')){
  $el=$store.ElementDirectory.FindElement([guid]$node.Id);if(!$el){$drift+="lost $($node.Id)";continue}
  $v=$el.AbsoluteBounds;$a=@($v.X,$v.Y,$v.Width,$v.Height);$e=@($node.absoluteBounds.Split(',')|ForEach-Object{[double]::Parse($_,[Globalization.CultureInfo]::InvariantCulture)})
  for($i=0;$i -lt 4;$i++){if([Math]::Abs($a[$i]-$e[$i]) -gt 1e-9){$drift+="drift $($node.Id)";break}};$geometry++
 }
 if($drift.Count){$errors+="Geometry: $($drift.Count)"}
 # safe-only source sub-rule: every consumer of a Symbol sourced from a Standard alias device
 [xml]$sx=Get-Content -LiteralPath $sal -Raw;$ns=New-Object Xml.XmlNamespaceManager($sx.NameTable);$ns.AddNamespace('s','http://schemas.microsoft.com/dsltools/SafetyApplicationLanguage')
 $rows=@();$violations=@()
 foreach($vx in $sx.SelectNodes('//s:variable',$ns)){
  $src=$vx.SelectNodes('s:sourceUsages//s:aliasDeviceIoUsage',$ns)
  foreach($a in $src){ if(!$standard.ContainsKey([string]$a.sdsId)){continue}
   $var=$model.Variables|Where-Object{$_.Id.ToString() -eq $vx.Id}
   if(!$var){$errors+="Native lost Symbol $($vx.name)";continue}
   foreach($u in $var.TargetUsages.Usages){$p=$u.FunctionBlockPort;if(!$p){$rows+=,[ordered]@{symbol=[string]$var.Name;sdsId=[string]$a.sdsId;nonFbUsage=$u.GetType().Name;violation=$false};continue};$b=$p.FunctionBlockBase
    $unsafe=$standard[[string]$a.sdsId].nativeUnsafe
    $viol=($unsafe -and $p.IsActivated -and !($b.GetType().Name -eq 'FBAnd' -and $p.ObjectIndex -eq 8))
    $row=[ordered]@{symbol=[string]$var.Name;sdsId=[string]$a.sdsId;block=[string]$b.Name;blockType=$b.GetType().Name;port=[string]$p.Name;portId=$p.Id.ToString();objectIndex=[int]$p.ObjectIndex;filter=[int]$p.Filter;contact=[string]$p.Deactivate1;active=[bool]$p.IsActivated;nativeUnsafe=$unsafe;violation=$viol}
    $rows+=,$row;if($viol){$violations+=,$row}
   }
  }
 }
 if($violations.Count){$errors+="Safe-only source sub-rule violations: $($violations.Count)"}
 $report=[ordered]@{status=if($errors.Count){'FAIL'}else{'PASS'};dir=$Dir;hashes=$hashes;nativeCrcValid=$valid;nativeCalculatedCrc=$crc;loadMessages=$messages;counts=$counts;gvl=@{count=$gvl.Count;fileCrcMismatch=$gvl.FileCrcMismatch};geometryShapesChecked=$geometry;geometryDrift=$drift;standardDevices=$standard;standardConsumers=$rows;violations=$violations;errors=$errors;nativeLibrarySha256=(Get-FileHash -LiteralPath (Join-Path $folders[1] 'SALDesignerControl.dll') -Algorithm SHA256).Hash.ToLower();limits=@('Offline native loader CRC/inventory/geometry and actual native unsafe-source predicate with the ObjectIndex8 FBAnd exemption (as previously documented for this project); not the whole project verifier, IDE Verify/Build, Target or hardware','Read-only: transaction rolled back, nothing saved')}
 $report|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $ResultPath -Encoding UTF8
 Write-Output "$($report.status) crcValid=$valid crc=$crc counts=$($counts|ConvertTo-Json -Compress) gvl=$($gvl.Count)/$($gvl.FileCrcMismatch) geometry=$geometry drift=$($drift.Count) standardConsumers=$($rows.Count) violations=$($violations.Count) errors=$($errors -join '; ')"
}finally{$tx.Rollback();$tx.Dispose();$store.Dispose()}
if($errors.Count){exit 1}
