$ErrorActionPreference='Continue'
. "$PSScriptRoot\sds-lib.ps1" | Out-Null
$flags=[Reflection.BindingFlags]'Instance,NonPublic,Public,Static,DeclaredOnly'
foreach($a in @($control,[Reflection.Assembly]::LoadFrom((Join-Path $folders[1] 'SALDesigner.dll')))){
try{$types=$a.GetTypes()}catch [Reflection.ReflectionTypeLoadException]{$types=$_.Exception.Types}
foreach($t in $types){ if(!$t){continue}; try{foreach($m in $t.GetMethods($flags)){ if($m.Name -match 'Crc' -and $t.FullName -match 'Project|Splc|Safety'){ "$($t.FullName)::$($m.Name)($(($m.GetParameters()|%{$_.ParameterType.Name}) -join ','))" } }}catch{} }
}
