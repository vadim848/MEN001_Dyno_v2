param([string]$Path,[string]$KeyRegex)
$a=[Reflection.Assembly]::ReflectionOnlyLoadFrom($Path)
foreach($n in $a.GetManifestResourceNames()){
  if($n -notlike '*.resources'){ continue }
  $s=$a.GetManifestResourceStream($n); $r=New-Object Resources.ResourceReader($s)
  foreach($e in $r){ if($e.Key -match $KeyRegex){ "[$n] $($e.Key) = $($e.Value)" } }
}
