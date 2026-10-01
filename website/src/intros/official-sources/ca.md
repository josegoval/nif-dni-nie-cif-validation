---
title: Fonts oficials
description: Totes les regles que nif-dni-nie-cif-validation aplica als NIF, DNI, NIF K/L/M, NIE i CIF espanyols, amb el seu identificador, el seu nivell de font (llei, criteri oficial o convenció) i la cita que les justifica.
---

Aquesta pàgina és [SPEC.md](https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md), l'especificació del que la biblioteca accepta i rebutja, generada a partir del fitxer cada vegada que es construeix el lloc web. Cada error que retorna `validate()` indica un dels identificadors de regla de més avall (`DNI-2`, `CIF-3`…), i cada regla té una àncora, com [#cif-3](#cif-3), que podeu enllaçar.

No totes les regles que trobareu a internet tenen una font oficial, de manera que cada regla té un nivell:

- **Llei (T1)**: un text legal vigent, publicat al BOE (Butlletí Oficial de l'Estat), com els formats del DNI, el NIE, el NIF K/L/M i el CIF, i les claus d'entitat del CIF.
- **Criteri oficial (T2)**: una pàgina de l'Administració responsable del document, el Ministeri de l'Interior o l'AEAT (l'Agència Tributària). La lletra de control del DNI (mòdul 23) es publica allà i a la nota tècnica de l'AEAT (T3), però no en cap llei.
- **Semioficial (T3)**: la nota tècnica interna de l'AEAT sobre el NIF. És l'única font que indica quines claus de CIF porten una xifra i quines una lletra.
- **Convenció (T4)**: una pràctica del sector sense text oficial, identificada com a tal. Les convencions només afecten la neteja de l'entrada (minúscules, separadors), mai quins documents són vàlids, amb una excepció documentada: cap text oficial no publica l'aritmètica del control del CIF ([CIF-4](#cif-4)).

L'especificació està escrita en anglès, i es mostra a continuació tal com és. Per proposar un canvi, consulteu [How to propose a change](#how-to-propose-a-change).
