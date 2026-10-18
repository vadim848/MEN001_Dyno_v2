# Pinned v2 SAL baseline

Exact byte copy of v2 checkpoint `4bb8703` SAL, retained on 2026-10-18 before
TwinSAFE implementation changes. Embedded CRC `872783435`; SHA256:
`B1FA361F5647EBA2A5BB8436E4853D8773BA7F6B0ACBF1E7F96C519196251DAA`.

Production reference repository was not used or modified for this fixture.
Twelve historical reproduction suites import `baselineSalPath`; the helper
verifies the SHA256 at load. Do not overwrite the fixture to make tests pass.

Current candidate remains `MEN001_Dyno/Safety_Dyno/TwinSafeGroup1/TwinSafeGroup1.sal`
relative to the repository root. Conformance, parser/runtime semantics and
assumption audits still read that candidate. Required-behavior acceptance
against modified SAL is incomplete; a green full suite does not certify it.
