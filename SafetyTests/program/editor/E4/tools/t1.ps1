. "$PSScriptRoot\sds-lib.ps1"
$d='C:\Users\user\source\repos\MEN001_Dyno_v2\MEN001_Dyno\Safety_Dyno\TwinSafeGroup1\Alias Devices\'
foreach($f in 'PLC_IO\IN_BIT_RnD_Mode.sds','PLC_IO\OUT_BIT_MotoCoolingEnable.sds','Safety_Step.sds'){
 $s=New-SdsXml ($d+$f) 0
 $o=[IO.File]::ReadAllText($d+$f)
 "$f same=$($s -eq $o.TrimStart([char]0xFEFF)) len $($s.Length) vs $($o.Length)"
 if($s -ne $o.TrimStart([char]0xFEFF)){ $s.Substring(0,200); '---'; $o.Substring(0,200)}
}
