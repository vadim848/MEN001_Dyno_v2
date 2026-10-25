$ErrorActionPreference='Stop'
$base='SafetyTests/network-symbol-repair'
$plan=Get-Content "$base/architect/SYMBOL_PLAN.json" -Raw | ConvertFrom-Json
$removed=@($plan.plan | ForEach-Object {$_.wireIds})
$summary=@()
foreach($pair in @(@('TwinSafeGroup1.sal','SAL'),@('GVL1.sgvl','SGVL'))) {
  $file=$pair[0]
  [xml]$before=Get-Content "$base/tester/baseline/$file" -Raw
  [xml]$after=Get-Content "$base/editor/candidate/$file" -Raw
  $old=@{}; $new=@{}
  foreach($node in $before.SelectNodes('//*[@Id]')) {$old[$node.GetAttribute('Id')]=$node}
  foreach($node in $after.SelectNodes('//*[@Id]')) {
    $id=$node.GetAttribute('Id')
    if($new.ContainsKey($id)){throw "Duplicate Id $id"}
    $new[$id]=$node
  }
  $missing=@($old.Keys | Where-Object {!$new.ContainsKey($_)} | Sort-Object)
  $expected=if($pair[1] -eq 'SAL'){@($removed | Sort-Object)}else{@()}
  if(($missing -join ',') -cne ($expected -join ',')){throw "Unexpected removed $file nodes"}
  foreach($id in $old.Keys) {
    if(!$new.ContainsKey($id)){continue}
    $a=$old[$id];$b=$new[$id]
    if($a.LocalName -cne $b.LocalName -or $a.NamespaceURI -cne $b.NamespaceURI){throw "Type changed $id"}
    $aa=@($a.Attributes | ForEach-Object {"$($_.Name)=$($_.Value)"}) -join '|'
    $ba=@($b.Attributes | ForEach-Object {"$($_.Name)=$($_.Value)"}) -join '|'
    if($aa -cne $ba){throw "Original attribute changed $id"}
    $parentA=$a.ParentNode; $parentB=$b.ParentNode
    if($parentA.LocalName -cne $parentB.LocalName){throw "Owner type changed $id"}
    if($parentA -is [System.Xml.XmlElement] -and $parentA.GetAttribute('Id') -cne $parentB.GetAttribute('Id')){throw "Owner changed $id"}
  }
  $summary+=@{file=$file;oldIdCount=$old.Count;newIdCount=$new.Count;removedIds=$missing.Count;originalAttributesAndOwners='PASS';sha256=(Get-FileHash "$base/editor/candidate/$file" -Algorithm SHA256).Hash.ToLowerInvariant()}
}
$summary | ConvertTo-Json -Depth 5 | Set-Content "$base/reviewer/DOM_INSPECTION.json"
$summary | ConvertTo-Json -Depth 5
