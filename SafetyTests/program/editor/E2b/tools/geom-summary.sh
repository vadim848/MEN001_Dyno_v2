# usage: geom-summary.sh <slice dir> <fbCount>   (from SafetyTests/)
d=$1; n=$2
sed -E "s/fbShapes === [0-9]+/fbShapes === $n/" $d/tools/geom-check.mjs > $d/tools/geom-check.tmp.mjs && mv $d/tools/geom-check.tmp.mjs $d/tools/geom-check.mjs
node $d/tools/geom-check.mjs $d/source/TwinSafeGroup1.sal.diagram $3/TwinSafeGroup1.sal.diagram $d/GEOMETRY.json > /dev/null
node -e "const g=require('./$d/GEOMETRY.json');const by={};for(const r of g.connectors.reroutedList)by[r.lane]=(by[r.lane]||0)+1;console.log(JSON.stringify({preserved:g.preservedShapes,viol:g.shapeSizeOrXViolations.length,laneShiftNonZero:Object.entries(g.laneShifts).filter(([,v])=>v.some(x=>x!==0)),multi:g.multiShiftLanes.length,conn:{same:g.connectors.same,rerouted:g.connectors.rerouted,by,removed:g.connectors.removed,added:g.connectors.added.length},newShapes:g.newShapes.map(s=>s.block+'@'+s.bounds),overlaps:g.newShapeOverlaps,verdict:g.verdict}))"
node $d/tools/conn-ends.mjs $d/source/TwinSafeGroup1.sal.diagram $3/TwinSafeGroup1.sal.diagram $d/CONNECTOR_ENDS.json | tr -d '\n '; echo
