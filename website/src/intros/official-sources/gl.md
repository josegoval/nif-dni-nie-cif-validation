---
title: Fontes oficiais
description: Todas as regras que nif-dni-nie-cif-validation aplica aos NIF, DNI, NIF K/L/M, NIE e CIF españois, co seu identificador, o seu nivel de fonte (lei, criterio oficial ou convención) e a cita que as respalda.
---

Esta páxina é [SPEC.md](https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md), a especificación do que a biblioteca acepta e rexeita, xerada a partir do ficheiro cada vez que se constrúe o sitio. Cada erro que devolve `validate()` indica un dos identificadores de regra de máis abaixo (`DNI-2`, `CIF-3`…), e cada regra ten unha áncora, como [#cif-3](#cif-3), que pode ligar.

Non todas as regras que atopará en internet teñen unha fonte oficial, así que cada regra ten un nivel:

- **Lei (T1)**: un texto legal en vigor, publicado no BOE (Boletín Oficial del Estado), como os formatos do DNI, o NIE, o NIF K/L/M e o CIF, e as claves de entidade do CIF.
- **Criterio oficial (T2)**: unha páxina da Administración responsable do documento, o Ministerio do Interior ou a AEAT (a Axencia Tributaria). A letra de control do DNI (módulo 23) publícase aí e na nota técnica da AEAT (T3), pero en ningunha lei.
- **Semioficial (T3)**: a nota técnica interna da AEAT sobre o NIF. É a única fonte que indica que claves de CIF levan un díxito e cales unha letra.
- **Convención (T4)**: unha práctica do sector sen texto oficial, identificada como tal. As convencións só afectan á limpeza da entrada (minúsculas, separadores), nunca a que documentos son válidos, cunha excepción documentada: ningún texto oficial publica a aritmética do control do CIF ([CIF-4](#cif-4)).

A especificación está escrita en inglés, e móstrase a continuación tal como está. Para propoñer un cambio, consulte [How to propose a change](#how-to-propose-a-change).
