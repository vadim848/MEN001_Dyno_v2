# Offline native load/save of a staged synthetic candidate via installed TwinSAFE writers (SALDesigner 1.4.16).
# Adapted from program/editor/E2-R1/tools/native-save.ps1. No IDE, no target, no ADS.
param([string]$InputDir,[string]$OutputDir,[string]$ReportPath,[switch]$Reload)
$ErrorActionPreference='Stop'
[IO.Directory]::CreateDirectory($OutputDir)|Out-Null
$folders=@('C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PrivateAssemblies','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\v170','C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16\Common','C:\Program Files\Beckhoff\TcXaeShell\Common7\IDE\PublicAssemblies')
Add-Type -TypeDefinition @'
using System; using System.IO; using System.Reflection;
public static class IdeSynResolver {
 public static string[] Folders;
 public static void Register(string[] folders) { Folders=folders; AppDomain.CurrentDomain.AssemblyResolve+=Resolve; }
 static Assembly Resolve(object sender,ResolveEventArgs e) { string file=new AssemblyName(e.Name).Name+".dll"; foreach(string folder in Folders) { string full=Path.Combine(folder,file); if(File.Exists(full)) return Assembly.LoadFrom(full); } return null; }
}
'@
[IdeSynResolver]::Register($folders)
foreach($file in @('Microsoft.VisualStudio.Modeling.Sdk.dll','Microsoft.VisualStudio.Modeling.Sdk.Diagrams.dll')){[Reflection.Assembly]::LoadFrom((Join-Path $folders[0] $file))|Out-Null}
[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll'))|Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $folders[2] 'GlobalVariableList.dll'))|Out-Null
$types=[type[]]@([Microsoft.VisualStudio.Modeling.Diagrams.CoreDesignSurfaceDomainModel],[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDomainModel])
$store=New-Object Microsoft.VisualStudio.Modeling.Store -ArgumentList (,$types)
$partition=New-Object Microsoft.VisualStudio.Modeling.Partition -ArgumentList $store
$validation=New-Object Microsoft.VisualStudio.Modeling.Validation.ValidationController
$helper=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageSerializationHelper]::Instance
$result=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
$transaction=$store.TransactionManager.BeginTransaction('ide-verify synthetic native serialization',$true)
try{
 $valid=$false;$crc=[uint32]0
 $model=$helper.LoadModelAndDiagram($result,$store.DefaultPartition,(Join-Path $InputDir 'TwinSafeGroup1.sal'),$partition,(Join-Path $InputDir 'TwinSafeGroup1.sal.diagram'),$null,$validation,$null,[ref]$valid,[ref]$crc)
 $messages=@();foreach($message in $result){$messages+="$($message.Kind): $($message.Message)"}
 if($result.Failed -or !$model){throw "Native load failed: $($messages -join ' | ')"}
 $blocks=@($model.Networks|ForEach-Object{$_.FunctionBlocks});$ports=@($blocks|ForEach-Object{@($_.InPorts)+@($_.OutPorts)})
 $shapeless=@($blocks|Where-Object{ @([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($_)).Count -eq 0 }).Count
 $diagram=@([Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]::GetPresentation($model))|Where-Object{$_ -is [BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.SafetyApplicationLanguageDiagram]}|Select-Object -First 1
 if(!$diagram){throw 'Existing diagram missing'}
 $transaction.Commit()
 $PVS=[Microsoft.VisualStudio.Modeling.Diagrams.PresentationViewsSubject]
 $fix=$store.TransactionManager.BeginTransaction('ide-verify fixup',$false)
 $fixLog=@()
 foreach($n in @($model.Networks)){ if(@($PVS::GetPresentation($n)).Count -eq 0){ [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($model,$n); $fixLog+="net $($n.Name) -> $(@($PVS::GetPresentation($n)).Count)" }
  foreach($b in @($n.FunctionBlocks)){ if(@($PVS::GetPresentation($b)).Count -eq 0){ [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($n,$b) }
   foreach($p in @(@($b.InPorts)+@($b.OutPorts))){ if(@($PVS::GetPresentation($p)).Count -eq 0){ [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($b,$p) } } } }
 $linkType=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.WiredLink]
 $links=@($store.ElementDirectory.FindElements($linkType::DomainClassId))
 $noConn=@($links|Where-Object{ @($PVS::GetPresentation($_)).Count -eq 0 })
 $fixLog+="links=$($links.Count) withoutConnectorBefore=$($noConn.Count)"
 foreach($l in $noConn){ $src=$l.SourceFunctionBlockPort; $net=$src.FunctionBlock.Network; [Microsoft.VisualStudio.Modeling.Diagrams.Diagram]::FixUpDiagram($net,$l) }
 $fix.Commit()
 $fixLog+="withoutConnectorAfter=$(@($links|Where-Object{ @($PVS::GetPresentation($_)).Count -eq 0 }).Count)"
 $shapeless=@($blocks|Where-Object{ @($PVS::GetPresentation($_)).Count -eq 0 }).Count
 $portsNoShape=@($ports|Where-Object{ @($PVS::GetPresentation($_)).Count -eq 0 }).Count
 $messages+=$fixLog
 if(!$Reload){
  $save=New-Object Microsoft.VisualStudio.Modeling.SerializationResult
  $encoding=[BeckhoffAutomation.SALDesigner.SafetyApplicationLanguage.ModelAndDiagramCrcSettings]::Encoding
  $helper.SaveModelAndDiagram($save,$model,(Join-Path $OutputDir 'TwinSafeGroup1.sal'),$diagram,(Join-Path $OutputDir 'TwinSafeGroup1.sal.diagram'),$encoding,$false)
  foreach($message in $save){$messages+="Save $($message.Kind): $($message.Message)"}
  if($save.Failed){throw 'Native save failed'}
  Copy-Item (Join-Path $InputDir 'GVL1.sgvl') (Join-Path $OutputDir 'GVL1.sgvl') -Force
 }
 $report=[ordered]@{reload=[bool]$Reload;input=$InputDir;loadFailed=$result.Failed;nativeCrcValid=$valid;calculatedCrc=$crc;messages=$messages;networks=$model.Networks.Count;variables=$model.Variables.Count;blocks=$blocks.Count;ports=$ports.Count;blocksWithoutShape=$shapeless;portsWithoutShape=$portsNoShape;limits='Offline native serialization only; not IDE Verify.'}
 $report|ConvertTo-Json -Depth 4|Set-Content $ReportPath -Encoding UTF8
 $report|ConvertTo-Json -Depth 4
}finally{$transaction.Dispose();$store.Dispose()}
