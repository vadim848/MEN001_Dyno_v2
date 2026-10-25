# Offline: instantiate target config classes WITHOUT running constructors and invoke the limit getters.
$ErrorActionPreference='Stop'
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\CommonExtensions\Microsoft\Editor')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class FbLimResolver {
 public static string[] Folders;
 public static void Register(string[] f){Folders=f;AppDomain.CurrentDomain.AssemblyResolve+=R;}
 static Assembly R(object s,ResolveEventArgs e){string file=new AssemblyName(e.Name).Name+".dll";foreach(string d in Folders){string p=Path.Combine(d,file);if(File.Exists(p))return Assembly.LoadFrom(p);}return null;}
}
'@
[FbLimResolver]::Register($folders)
$c=[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesignerControl.dll'))
$ns='Beckhoff.SALDesigner.TC3CustomCode.SafetyProject.TargetSystemHandling.'
$props='Max_FunctionBlockNumber','Max_GroupNumber','Max_TsConnnectionNumber','Max_ByteSizeOfInternalProcessImage','Max_FSoEUserParaSize','Max_FSoEMessageSize','Max_FsoeAddress','Max_UserCount','Max_StdInSize','Max_StdOutSize','Max_NearProcessImage','Max_EtherCATSize','Max_SafeLogicPages','Max_SafeUserParamPages','Max_MappingCodeSize','Max_SendMessageCrcs','Max_FramDataSize','Max_TwinSAFESCMasterConnections','IsUsedVendorSpecficProjectLimitInfos'
$out=[ordered]@{}
foreach($cls in 'TargetSystemConfigEL6900','TargetSystemConfigEL6910','TargetSystemConfigEL1918'){
 $t=$c.GetType($ns+$cls,$true)
 $o=[Runtime.Serialization.FormatterServices]::GetUninitializedObject($t)
 $chain=@(); $b=$t; while($b){$chain+=$b.Name;$b=$b.BaseType}
 $vals=[ordered]@{inheritance=($chain -join ' -> ')}
 # ESI path (ModuleTwinSAFELogic) needs the IDE project node; without it the first call throws inside get_SupportedLocalIOAliasDeviceConfigurations, then the getter takes its no-ESI fallback (base class constant).
 $mp=$t.GetProperty('ModuleTwinSAFELogic',[Reflection.BindingFlags]'Instance,Public,NonPublic'); if($mp){ try{$vals['ModuleTwinSAFELogic(probe)']=[string]$mp.GetValue($o,$null)}catch{$e=$_.Exception;while($e.InnerException){$e=$e.InnerException};$vals['ModuleTwinSAFELogic(probe)']='EXC '+$e.GetType().Name+' (no IDE project node -> ESI path unavailable; fallback used below)'} }
 foreach($p in $props){ $pi=$t.GetProperty($p,[Reflection.BindingFlags]'Instance,Public,NonPublic')
  if(!$pi){$vals[$p]='n/a';continue}
  try{$vals[$p]=$pi.GetValue($o,$null)}catch{$e=$_.Exception;while($e.InnerException){$e=$e.InnerException};$vals[$p]='EXC '+$e.GetType().Name+': '+$e.Message} }
 $out[$cls]=$vals
}
$out|ConvertTo-Json -Depth 4
