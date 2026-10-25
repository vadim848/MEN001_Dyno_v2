$ErrorActionPreference='Stop'
$base='SafetyTests/network-symbol-repair'
function DomKey($node) {
  if($node -isnot [System.Xml.XmlElement]) {return $node.Value.Trim()}
  $attributes=@($node.Attributes | Sort-Object Name | ForEach-Object { $_.Name+'='+$_.Value }) -join '|'
  $children=@($node.ChildNodes | ForEach-Object { DomKey $_ }) -join ''
  return '<'+$node.LocalName+' '+$attributes+'>'+$children+'</'+$node.LocalName+'>'
}
[xml]$expected=Get-Content "$base/editor/candidate/TwinSafeGroup1.sal" -Raw
[xml]$consolidated=Get-Content "$base/editor/candidate-native-bindings/TwinSafeGroup1.sal" -Raw
$rows=@();$retired=@()
foreach($v in $expected.SelectNodes('//*[local-name()="variable"]')) {
  foreach($role in @($v.SelectNodes('*[local-name()="sourceUsages" or local-name()="targetUsages"]'))) {
    $relationships=@($role.SelectNodes('*')); if($relationships.Count -le 1){continue}
    $primary=$relationships[0];$usages=$primary.SelectSingleNode('*[local-name()="variableUsages"]/*[local-name()="usages"]')
    $moved=0
    foreach($extra in $relationships[1..($relationships.Count-1)]) {
      $collection=$extra.SelectSingleNode('*[local-name()="variableUsages"]')
      foreach($record in @($collection.SelectNodes('*[local-name()="usages"]/*'))) {[void]$usages.AppendChild($record);$moved++}
      $retired+=@($extra.GetAttribute('Id'),$collection.GetAttribute('Id'))
      [void]$role.RemoveChild($extra)
    }
    $rows+=@{variable=$v.GetAttribute('name');movedUsageRecords=$moved}
  }
}
if($rows.Count -ne 10 -or $retired.Count -ne 54){throw 'Unexpected consolidation scope'}
if($expected.OuterXml -cne $consolidated.OuterXml){throw 'Consolidation changed more than exact singleton normalization'}
[xml]$native=Get-Content "$base/editor/native-reviewed-output/TwinSafeGroup1.sal" -Raw
$nativeCrc=$native.DocumentElement.GetAttribute('Crc')
$native.DocumentElement.SetAttribute('Crc',$consolidated.DocumentElement.GetAttribute('Crc'))
$empty=$consolidated.SelectNodes('//*[local-name()="targetFunctionBlockPorts" and not(*)]')
$emptyCount=$empty.Count
foreach($node in @($empty)){[void]$node.ParentNode.RemoveChild($node)}
if($emptyCount -ne 2){throw 'Unexpected native empty-container omission scope'}
if((DomKey $consolidated.DocumentElement) -cne (DomKey $native.DocumentElement)){throw 'Native SAL changed beyond Crc and two empty wire containers'}
[xml]$oldGlobal=Get-Content "$base/editor/candidate/GVL1.sgvl" -Raw
[xml]$nativeGlobal=Get-Content "$base/editor/native-reviewed-output/GVL1.sgvl" -Raw
$nativeGlobalCrc=$nativeGlobal.DocumentElement.GetAttribute('Crc')
$nativeGlobal.DocumentElement.SetAttribute('Crc',$oldGlobal.DocumentElement.GetAttribute('Crc'))
if((DomKey $oldGlobal.DocumentElement) -cne (DomKey $nativeGlobal.DocumentElement)){throw 'Native SGVL changed beyond Crc'}
$report=@{status='PASS';proof='Independent .NET XML DOM complete-document equality after only explicit54container retirement/consolidation, nativeCrcattributes,2emptywirecontainer omissions';retiredCount=$retired.Count;rows=$rows;nativeSalCrc=$nativeCrc;nativeSgvlCrc=$nativeGlobalCrc;files=@(Get-ChildItem "$base/editor/native-reviewed-output" -File | Get-FileHash -Algorithm SHA256 | Select-Object Path,Hash)}
$report | ConvertTo-Json -Depth 5 | Set-Content "$base/reviewer/NATIVE_DOM_INSPECTION.json"
$report | ConvertTo-Json -Depth 5

