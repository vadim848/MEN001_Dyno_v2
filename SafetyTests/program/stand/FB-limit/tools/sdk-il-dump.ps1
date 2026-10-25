param([string]$Asm='SALDesignerControl.dll', [string]$TypeRegex, [string]$MemberRegex='.', [switch]$Enums)
$sdk='C:\Program Files (x86)\Beckhoff\TwinCAT\3.1\Components\Safety\1.4.16'
$vs=[IO.Path]::Combine($env:ProgramFiles,'Beckhoff','TcXaeShell','Common7','IDE')
$dirs=@("$sdk\v170","$sdk\Common","$vs\PublicAssemblies","$vs\PrivateAssemblies","$vs\CommonExtensions\Microsoft\Editor","$vs")
[AppDomain]::CurrentDomain.add_ReflectionOnlyAssemblyResolve({ param($s,$e)
  $n=(New-Object Reflection.AssemblyName($e.Name)).Name
  foreach($d in $dirs){ $p=Join-Path $d "$n.dll"; if(Test-Path $p){ return [Reflection.Assembly]::ReflectionOnlyLoadFrom($p) } }
  try { return [Reflection.Assembly]::ReflectionOnlyLoad($e.Name) } catch { return $null }
})
$asmPath= if([IO.Path]::IsPathRooted($Asm)){$Asm}else{Join-Path "$sdk\v170" $Asm}
$a=[Reflection.Assembly]::ReflectionOnlyLoadFrom($asmPath)
$mod=$a.ManifestModule
$ops=@{}; foreach($f in [Reflection.Emit.OpCodes].GetFields()){ $o=$f.GetValue($null); $ops[[uint16]([int]$o.Value -band 0xFFFF)]=$o }
try { $types=$a.GetTypes() } catch [Reflection.ReflectionTypeLoadException] { $types=$_.Exception.Types | ?{$_} }
$bf=[Reflection.BindingFlags]'Public,NonPublic,Instance,Static,DeclaredOnly'
function Res($tok){ try { $m=$mod.ResolveMember($tok); return ($m.DeclaringType.FullName -replace '^.*\.','') + '::' + $m.Name } catch { try { return 'T:'+$mod.ResolveType($tok).FullName } catch { return ('tok{0:X8}' -f $tok) } } }
foreach($t in $types | ?{ $_.FullName -match $TypeRegex }){
  if($Enums -and $t.IsEnum){ "ENUM $($t.FullName)"; foreach($f in $t.GetFields($bf) | ?{ $_.IsLiteral }){ "  $($f.Name) = $($f.GetRawConstantValue())" }; continue }
  foreach($m in @($t.GetMethods($bf))+@($t.GetConstructors($bf)) | ?{ $_.Name -match $MemberRegex }){
    $body=$null; try{$body=$m.GetMethodBody()}catch{}
    "== $($t.FullName)::$($m.Name)"
    if(-not $body){ continue }
    $il=$body.GetILAsByteArray(); $p=0
    while($p -lt $il.Length){ $s=$p; [uint16]$c=$il[$p++]; if($c -eq 0xFE){ $c=[uint16](0xFE00 -bor $il[$p++]) }
      $op=$ops[[uint16]$c]; $v=''; $ot=$op.OperandType.ToString()
      switch -regex ($ot){
        '^InlineNone$' {}
        '^(ShortInlineBrTarget|ShortInlineI|ShortInlineVar)$' { $v=[string]$il[$p]; $p+=1 }
        '^InlineVar$' { $v=[BitConverter]::ToInt16($il,$p); $p+=2 }
        '^(InlineI8|InlineR)$' { $p+=8 }
        '^InlineSwitch$' { $n=[BitConverter]::ToInt32($il,$p); $p+=4+4*$n }
        '^InlineString$' { $tk=[BitConverter]::ToInt32($il,$p); try{$v='"'+$mod.ResolveString($tk)+'"'}catch{$v='str?'}; $p+=4 }
        '^(InlineMethod|InlineField|InlineType|InlineTok)$' { $tk=[BitConverter]::ToInt32($il,$p); $v=Res $tk; $p+=4 }
        default { $v=[BitConverter]::ToInt32($il,$p); $p+=4 }
      }
      '  {0:X4} {1} {2}' -f $s,$op.Name,$v }
  }
}
