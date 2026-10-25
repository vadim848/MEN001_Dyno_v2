# Revision2

Supersedes proposal manifestSHA
2a0803ed5ae9008c05e5e8e3e0556803947b0891648c75f2bf89ced9c50a211e,
reviewed CHANGES REQUIRED in LV_OFFICIAL_TEST_PROPOSAL_REVIEW.md.
MANIFEST.v1.json preserves its exact file hash list; original frozen RED and
the separately accepted cfd851 LV254 package are unchanged.

Added causal native RS obligations before NOT VERIFIED classification, with
reset dominance and last eligibility diagnostics. Added immediate native output
snapshots and startup/Rnd RS consumer observation to the helper. The invariant
now includes the edge into the first actual accepted-SG sample and enforces
actual LV/HV consumedSetFALSE rather than only proposal/output observations.
No behavioral oracle, timer, source, canonical test or runtime was changed.
Syntax checks PASS; functional execution NOT RUN pending renewed review gate.
