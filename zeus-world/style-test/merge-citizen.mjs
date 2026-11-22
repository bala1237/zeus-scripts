// Combines the rigged citizen and its animation clips into one GLB.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read('raw/anim_walk.glb');
const root = doc.getRoot(); const byName = new Map(root.listNodes().map((n) => [n.getName(), n]));
root.listAnimations().forEach((a) => a.setName('Walk'));
for (const [file, name] of [['raw/anim_idle.glb', 'Idle'], ['raw/anim_cheer.glb', 'Cheer'], ['raw/anim_clap.glb', 'Clap']]) {
  const src = await io.read(file);
  for (const a of src.getRoot().listAnimations()) {
    const anim = doc.createAnimation(name);
    for (const ch of a.listChannels()) {
      const target = byName.get(ch.getTargetNode().getName()); if (!target) continue;
      const s = ch.getSampler();
      const inp = doc.createAccessor().setType(s.getInput().getType()).setArray(s.getInput().getArray().slice());
      const out = doc.createAccessor().setType(s.getOutput().getType()).setArray(s.getOutput().getArray().slice());
      const samp = doc.createAnimationSampler().setInput(inp).setOutput(out).setInterpolation(s.getInterpolation());
      anim.addSampler(samp).addChannel(doc.createAnimationChannel().setTargetNode(target).setTargetPath(ch.getTargetPath()).setSampler(samp));
    }
  }
}
const buf = root.listBuffers()[0]; root.listAccessors().forEach((a) => a.setBuffer(buf));
root.listBuffers().slice(1).forEach((b) => b.dispose());
await doc.transform(dedup(), prune());
await io.write('raw/citizen_merged.glb', doc);
console.log(root.listAnimations().map((a) => a.getName() + ':' + a.listChannels().length));
