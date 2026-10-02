---
title: Fuentes oficiales
description: Todas las reglas que nif-dni-nie-cif-validation aplica a los NIF, DNI, NIF K/L/M, NIE y CIF españoles, con su identificador, su nivel de fuente (ley, criterio oficial o convención) y la cita que las respalda.
---

Esta página es [SPEC.md](https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md), la especificación de lo que la librería acepta y rechaza, generada a partir del archivo cada vez que se construye el sitio. Cada error que devuelve `validate()` indica uno de los identificadores de regla de abajo (`DNI-2`, `CIF-3`…), y cada regla tiene un ancla, como [#cif-3](#cif-3), que puedes enlazar.

No todas las reglas que encontrarás en internet tienen una fuente oficial, así que cada regla tiene un nivel:

- **Ley (T1)**: un texto legal en vigor, publicado en el BOE (Boletín Oficial del Estado), como los formatos del DNI, el NIE, el NIF K/L/M y el CIF, y las claves de entidad del CIF.
- **Criterio oficial (T2)**: una página de la Administración responsable del documento, el Ministerio del Interior o la AEAT (la Agencia Tributaria). La letra de control del DNI (módulo 23) se publica ahí y en la nota técnica de la AEAT (T3), pero en ninguna ley.
- **Semioficial (T3)**: la nota técnica interna de la AEAT sobre el NIF. Es la única fuente que indica qué claves de CIF llevan un dígito y cuáles una letra.
- **Convención (T4)**: una práctica del sector sin texto oficial, identificada como tal. Las convenciones solo afectan a la limpieza de la entrada (minúsculas, separadores), nunca a qué documentos son válidos, con una excepción documentada: ningún texto oficial publica la aritmética del control del CIF ([CIF-4](#cif-4)).

La especificación está escrita en inglés, y se muestra a continuación tal cual. Para proponer un cambio, consulta [How to propose a change](#how-to-propose-a-change).
