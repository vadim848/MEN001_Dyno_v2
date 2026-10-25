import fs from "node:fs";
import path from "node:path";

export function readAliasDescriptors(root) {
  const result = new Map();
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".sds")) {
        const xml = fs.readFileSync(file, "utf8");
        const id = xml.match(/<SDSID>(\d+)<\/SDSID>/)?.[1];
        if (!id) throw new Error(`Alias descriptor missing SDSID: ${file}`);
        if (result.has(id)) throw new Error(`Duplicate SDSID ${id}`);
        result.set(id, { file: path.relative(root, file).replaceAll("\\", "/"),
          kind: xml.includes("<StandardAliasDevice>") ? "StandardAliasDevice" :
            xml.includes("<SafetyAliasDevice>") ? "SafetyAliasDevice" : "OtherAliasDevice",
          connectionType: xml.match(/<ConnectionType>([^<]+)<\/ConnectionType>/)?.[1] ?? null });
      }
    }
  }
  visit(root); return result;
}

export function signalBindings(model, aliases) {
  return model.variables.map(v => ({
    signal: v.name, alias: v.alias ? { sdsId: v.alias.sdsId, channelId: v.alias.channelId, functionId: v.alias.functionId } : null,
    descriptor: aliases.get(v.alias?.sdsId) ?? null,
    writers: v.sourcePorts, readers: v.targetPorts, groupPorts: v.groupPorts ?? [],
    electricalPolarity: "UNVERIFIED", completionProof: "NOT ESTABLISHED BY ALIAS METADATA",
    interpretation: v.name === "in_Door_Monitor" ? "Standard alias: not independently proven safe closed/locked feedback" :
      v.name === "in_Safety_Run" ? "Requested group RunStop; not qualified actual group RUN status" :
      v.name === "GroupPort_ErrAck" ? "Group error acknowledgement; not mode recovery or energy-removal proof" : null
  }));
}
