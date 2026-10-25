param([string]$SalPath='MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal',[string]$SgvlPath='MEN001_Dyno/Safety_Dyno/GVLs/GVL1.sgvl',[string]$ResultPath=(Join-Path $PSScriptRoot 'NATIVE_BASELINE_RULE.json'))
# Read-only isolated native safety-source predicate and filter enum probe.
# Run from repository root with Windows PowerShell 5.1; no project or hardware mutation.
$ErrorActionPreference='Stop'
$testerBase=Join-Path (Get-Location) 'SafetyTests/safe-input-validation-repair/tester'
& node (Join-Path $testerBase 'preflight.mjs') $SalPath $SgvlPath
if($LASTEXITCODE -ne 0){throw 'Full singleton/wire/typed binding preflight failed before native graph selection'}
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
if((Get-FileHash -LiteralPath $sds.FullName -Algorithm SHA256).Hash.ToLower() -ne '90d5132726bc9408f6cc7f716723b005c37aa3d698e216b33f59e5a151e69f02'){throw 'Immutable given program source SDS changed'}
$device.Load([version]'1.9',$xml)
try{$types=$control.GetTypes()}catch [Reflection.ReflectionTypeLoadException]{$types=$_.Exception.Types};$verify=$types|Where-Object{$_ -and $_.Name -eq 'VerifierHSafetyPLC'}|Select-Object -First 1
$closure=$verify.GetNestedTypes($flags)|Where-Object{$_.Name -eq '<>c'}|Select-Object -First 1
$predicate=$closure.GetMethod('<VerifyPortHasOnlySafeIoMappings>b__49_0',$flags)
$singleton=$closure.GetField('<>9',$flags).GetValue($null)
$io=$device.IOs[0]
Write-Output "NativeSdsId=$($device.SdsId) IOCount=$($device.IOs.Count) SafetyType=$($io.SafetyType) IsUnsafe=$($predicate.Invoke($singleton,@($io.PSObject.BaseObject))) file=$($sds.FullName)"
$filterType=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortConnectableFilter]
foreach($v in [Enum]::GetValues($filterType)){Write-Output "Filter $([int]$v)=$v"}
$domainTypes=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$domainTypes)
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$transaction=$store.TransactionManager.BeginTransaction('Independent read-only native source and slot subrule',$true)
try{
 $result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult;$valid=$false;$crc=[uint32]0
 $model=$helper.LoadModel($result,$store.DefaultPartition,(Resolve-Path -LiteralPath $SalPath).Path,$null,$validation,$null,[ref]$valid,[ref]$crc)
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{$_.InPorts})+@($blocks|ForEach-Object{$_.OutPorts})
 $variable=$model.Variables|Where-Object{$_.Id.ToString() -eq '6d615846-7050-4fe7-9d46-85e8b6460f93'}
 if(!$model -or $result.Failed -or $model.Networks.Count -ne 14 -or $blocks.Count -ne 242 -or $ports.Count -ne 2076 -or $model.Variables.Count -ne 75){throw 'Native complete model/count invariant failed'}
 if(!$variable -or $variable.Name -ne 'in_Estop_PLC' -or $variable.TargetUsages.Usages.Count -ne 6){throw 'Native exact alias identity/all six consumers invariant failed'}
 [xml]$salXml=Get-Content -LiteralPath $SalPath -Raw
 $manager=New-Object Xml.XmlNamespaceManager($salXml.NameTable);$manager.AddNamespace('s','http://schemas.microsoft.com/dsltools/SafetyApplicationLanguage')
 $source=$salXml.SelectSingleNode('//s:variable[@Id="6d615846-7050-4fe7-9d46-85e8b6460f93"]/s:sourceUsages//s:aliasDeviceIoUsage',$manager)
 if(!$source -or $source.sdsId -ne [string]$device.SdsId -or $source.channelId -ne '1' -or $source.functionId -ne '1131179973'){throw 'Pinned existing program source identity differs'}
 $rows=@();$errors=@();$mutationChecks=@();$unsafe=[bool]$predicate.Invoke($singleton,@($io.PSObject.BaseObject))
 if(!$unsafe -or [string]$io.SafetyType -ne 'Standard'){throw 'Actual native SDS safety predicate contract differs'}
 foreach($usage in $variable.TargetUsages.Usages){
  $p=$usage.FunctionBlockPort;$block=$p.FunctionBlockBase
  if(!$p -or $block.GetType().Name -ne 'FBAnd'){throw 'Expected native FBAnd consumer missing'}
  if(!$p.IsActivated){throw 'Required PLC stop guard deactivated'}
  $slotViolation=($p.ObjectIndex -ne 8 -and $unsafe)
  $row=[ordered]@{block=[string]$block.Name;port=[string]$p.Name;portId=$p.Id.ToString();usageId=$usage.Id.ToString();objectIndex=[int]$p.ObjectIndex;nativeFilter=[int]$p.Filter;contact=[string]$p.Deactivate1;active=[bool]$p.IsActivated;nativeSourceSafety=[string]$io.SafetyType;nativePredicateUnsafe=$unsafe;safeOnlyViolation=$slotViolation}
  $rows+=,$row
  if($slotViolation){$errors+=,$row
   $oldFilter=$p.Filter;$p.Filter=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.FunctionBlockPortConnectableFilter]3
   $stillError=($p.ObjectIndex -ne 8 -and [bool]$predicate.Invoke($singleton,@($io.PSObject.BaseObject)))
   $mutationChecks+=@{name="Filter3 on nonfirst native slot $($p.Id) cannot launder standard source";passed=$stillError}
   $p.Filter=$oldFilter
  }
 }
 $report=[ordered]@{status=if($errors.Count){'FAIL_SAFE_ONLY_SOURCE_RULE'}else{'PASS_SAFE_ONLY_SOURCE_SUBRULE'};salSha256=(Get-FileHash -LiteralPath $SalPath -Algorithm SHA256).Hash.ToLower();nativeCrcValid=$valid;nativeCalculatedCrc=$crc;sourceSdsSha256=(Get-FileHash -LiteralPath $sds.FullName -Algorithm SHA256).Hash.ToLower();nativeLibrarySha256=(Get-FileHash -LiteralPath (Join-Path $folders[1] 'SALDesignerControl.dll') -Algorithm SHA256).Hash.ToLower();sourceAliasId=$variable.Id.ToString();sourceNativeType=$device.GetType().FullName;sourceNativeSafetyType=[string]$io.SafetyType;sourceNativeIsUnsafe=$unsafe;counts=@{networks=$model.Networks.Count;blocks=$blocks.Count;ports=$ports.Count;symbols=$model.Variables.Count;requiredConsumers=$rows.Count};consumers=$rows;errors=$errors;mutationChecks=$mutationChecks;limits=@('Executes actual installed native unsafe-source predicate on the actual native-loaded existing SDS IO, and applies independently documented/native-IL ObjectIndex8 AND exemption to each full-native-model consumer. Does not invoke whole VerifyFbAnd or project verifier/context.','Native SAL loader does not retain external aliasDeviceIoUsage without project resolver; exact source identity is separately pinned from program XML to actual native SDS. No hardware configuration changed or origin investigated.','CRC validation, software preservation, project compiler and target-dependent checks are separate. No save or equipment operation.')}
 $report|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $ResultPath -Encoding UTF8
 Write-Output ($report|ConvertTo-Json -Depth 10)
}finally{$transaction.Rollback();$transaction.Dispose();$store.Dispose()}
if($errors.Count){exit 1}






