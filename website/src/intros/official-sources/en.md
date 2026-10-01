---
title: Official sources
description: Every rule that nif-dni-nie-cif-validation applies to Spanish NIF, DNI, K/L/M, NIE and CIF numbers, with its ID, its source tier (law, official guidance or convention) and the citation behind it.
---

<!-- cspell:ignore Boletín Oficial -->

This page is [SPEC.md](https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md), the specification of what the library accepts and rejects, rendered from the file each time the site is built. Every error that `validate()` reports names one of the rule IDs below (`DNI-2`, `CIF-3`…), and every rule has an anchor, such as [#cif-3](#cif-3), that you can link to.

Not every rule you find online has an official source, so each rule has a tier:

- **Law (T1)**: a legal text in force, published in the BOE (*Boletín Oficial del Estado*), such as the formats of the DNI, NIE, K/L/M NIF and CIF, and the CIF organisation keys.
- **Official guidance (T2)**: a page of the administration responsible for the document, the Ministerio del Interior or the AEAT (the Spanish tax agency). The DNI check letter (mod 23) is published there and in the AEAT's technical note (T3), but in no law.
- **Semi-official (T3)**: the AEAT's internal technical note on the NIF. It is the only source for which CIF keys take a digit and which take a letter.
- **Convention (T4)**: industry practice with no official text, labelled as such. Conventions only affect input cleanup (lower case, separators), never which documents are valid, with one documented exception: no official text publishes the CIF control arithmetic ([CIF-4](#cif-4)).

The specification itself is written in English. To propose a change, see [How to propose a change](#how-to-propose-a-change).
