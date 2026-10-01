<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-light.svg">
    <img alt="nif-dni-nie-cif-validation: Spanish NIF, DNI, NIE & CIF validation. Tiny. Typed. Correct." src="https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/brand/readme-header-light.svg" width="720">
  </picture>
</p>

<p align="center"><a href="README.md">English</a> · <strong>Español</strong></p>

`nif-dni-nie-cif-validation` comprueba identificadores fiscales españoles (NIF, DNI, NIF K/L/M, NIE y CIF) con las reglas oficiales, y te dice por qué un número no es válido. Cada regla que aplica tiene una fuente documentada en [SPEC.md](SPEC.md): legislación, documentación oficial, una nota técnica de la AEAT o una convención identificada como tal.

[![npm version](https://img.shields.io/npm/v/nif-dni-nie-cif-validation)](https://www.npmjs.com/package/nif-dni-nie-cif-validation)
[![npm downloads](https://img.shields.io/npm/dm/nif-dni-nie-cif-validation)](https://www.npmjs.com/package/nif-dni-nie-cif-validation)
<!-- size-badge:start -->[![isValidNif: 929 B min+gzip](https://img.shields.io/badge/min%2Bgzip-isValidNif%20929%20B-blue)](#rendimiento)<!-- size-badge:end -->
[![npm provenance](https://img.shields.io/badge/npm-provenance-blue)](https://www.npmjs.com/package/nif-dni-nie-cif-validation#provenance)
[![CI](https://github.com/josegoval/nif-dni-nie-cif-validation/actions/workflows/release.yml/badge.svg?branch=master)](https://github.com/josegoval/nif-dni-nie-cif-validation/actions/workflows/release.yml)
[![coverage](https://raw.githubusercontent.com/josegoval/nif-dni-nie-cif-validation/master/.github/badges/coverage.svg)](https://github.com/josegoval/nif-dni-nie-cif-validation/actions/workflows/release.yml)
[![license: MIT](https://img.shields.io/npm/l/nif-dni-nie-cif-validation)](LICENSE)

## Inicio rápido

```sh
npm install nif-dni-nie-cif-validation
```

<details>
<summary>pnpm, yarn, bun, deno</summary>

```sh
pnpm add nif-dni-nie-cif-validation
```

```sh
yarn add nif-dni-nie-cif-validation
```

```sh
bun add nif-dni-nie-cif-validation
```

```sh
deno add npm:nif-dni-nie-cif-validation
```

</details>

```ts
import { isValidNif, validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

isValidNif("12345678Z");      // true
isValidNif(" 12.345.678-z "); // true: se eliminan espacios, puntos y guiones, y se convierten las minúsculas en mayúsculas
isValidNif("B12345675");      // false: el dígito de control no es correcto
validate("12345678A", { locale: es }).error?.message; // "El carácter de control no es correcto: para este DNI debería ser «Z»."
```

## Contenido

- [¿Qué función necesito?](#qué-función-necesito)
- [Características](#características)
- [Resumen de la API](#resumen-de-la-api)
- [Recetas](#recetas): Zod y React Hook Form, Express, datos de prueba, mensajes en catalán
- [DNI, NIE, NIF y CIF](#dni-nie-nif-y-cif)
- [Ley, guía oficial y convención](#ley-guía-oficial-y-convención)
- [Rendimiento](#rendimiento)
- [Comparación con otras bibliotecas](#comparación-con-otras-bibliotecas)
- [Uso con agentes de programación con IA](#uso-con-agentes-de-programación-con-ia)
- [Migración](#migración)
- [Contribuir, seguridad y licencia](#contribuir-seguridad-y-licencia)

## ¿Qué función necesito?

| Quiero… | Usa | Importa de |
| --- | --- | --- |
| Aceptar cualquier NIF válido: DNI, K/L/M, NIE o CIF | `isValidNif(value)` | `nif-dni-nie-cif-validation` |
| Aceptar solo personas físicas: DNI, K/L/M o NIE | `isValidNaturalPersonNif(value)` | `nif-dni-nie-cif-validation` |
| Aceptar un DNI (o un NIF K/L/M) | `isValidDni(value)` | `nif-dni-nie-cif-validation` |
| Aceptar un NIE | `isValidNie(value)` | `nif-dni-nie-cif-validation` |
| Aceptar empresas y otras entidades (CIF) | `isValidCif(value)`, alias `isValidLegalEntityNif` | `nif-dni-nie-cif-validation` |
| Aceptar un NIF-IVA español (`ES` + NIF, solo el formato) | `isValidSpanishVat(value)` | `nif-dni-nie-cif-validation` |
| Saber **por qué** un valor no es válido, su tipo y qué guardar | `validate(value, options)` | `nif-dni-nie-cif-validation` |
| Obtener la forma canónica para guardarla | `normalize(value)` | `nif-dni-nie-cif-validation` |
| Mostrarlo agrupado, como `12345678-Z` | `format(value)` | `nif-dni-nie-cif-validation` |
| Detectar el tipo sin comprobar el carácter de control | `getNifType(value)` | `nif-dni-nie-cif-validation` |
| Calcular el carácter de control de un número | `computeControlCharacter(partial)` | `nif-dni-nie-cif-validation` |
| Saber qué tipo de organización es un CIF | `describeCifOrganisation(key, locale)` | `nif-dni-nie-cif-validation` |
| Comprobar solo el carácter de control, no el formato | `isValidDniLetter(value)`, `isValidCifControlCode(value)` (alias `isValidLegalEntityNifControlCode`) | `nif-dni-nie-cif-validation` |
| Mostrar los mensajes en español, catalán, euskera o gallego | `es`, `ca`, `eu`, `gl` (y `en`), pasados como `{ locale }` | `nif-dni-nie-cif-validation/locales/<code>` |
| Generar números ficticios válidos para tests | `generateDni`, `generateNie`, `generateCif`, `generateNif`, `createGenerator` | `nif-dni-nie-cif-validation/generate` |
| Generar valores no válidos para tests negativos | `generateInvalid(type, { reason })` | `nif-dni-nie-cif-validation/generate` |
| Validar un campo de formulario con Zod | `zNif`, `zDni`, `zNie`, `zCif`, `zSpanishVat` | `nif-dni-nie-cif-validation/zod` |
| … con Valibot | `vNif`, `vDni`, `vNie`, `vCif`, `vSpanishVat` | `nif-dni-nie-cif-validation/valibot` |
| … con Yup | `yNif`, `yDni`, `yNie`, `yCif`, `ySpanishVat` | `nif-dni-nie-cif-validation/yup` |
| Seguir usando las expresiones regulares y las tablas de letras de la v1 | `DNI_REGEX`, `NIE_REGEX`, `LEGAL_ENTITY_NIF_REGEX` (alias `CIF_REGEX`), `DNI_CONTROL_LETTERS`, `LEGAL_ENTITY_CONTROL_LETTERS` (alias `CIF_CONTROL_LETTERS`). Las expresiones regulares solo comprueban el formato, y las tablas contienen las letras de control: mejor usa las funciones de arriba | `nif-dni-nie-cif-validation` |
| Cambiar la letra de un NIE por su dígito (v1) | `replaceNieLetter(value)`: obsoleta, lanza una excepción con una entrada incorrecta | `nif-dni-nie-cif-validation` |

## Características

- **Correcta y con fuentes.** Cada regla tiene un identificador (`DNI-2`, `NIE-3`, `CIF-3`…) y una fuente en [SPEC.md](SPEC.md): la ley, una página oficial de la Administración, la nota técnica de la AEAT o una convención identificada como tal. Cada error indica la regla que ha fallado. Los tests cubren todas las reglas, comparan los resultados con [stdnum](https://www.npmjs.com/package/stdnum) en unas 50 000 entradas y comparan cada función de la v1 con la v1.0.11 en unas 490 000 entradas.
- **0 dependencias en tiempo de ejecución.** Zod, Valibot y Yup son dependencias *peer* opcionales, que solo necesitan sus adaptadores.
- **Pequeña.** Un validador booleano añade menos de 1 kB minificado y comprimido con gzip, y `validate()` con sus mensajes en inglés, menos de 3 kB. La integración continua (CI) hace cumplir esos límites (`pnpm size`); el tamaño de cada función está en [Rendimiento](#rendimiento).
- **Tipada.** Escrita en TypeScript, con declaraciones para `import` y para `require`, y con los tipos exportados (`ValidationResult`, `NifType`, `NifErrorCode`…).
- **Módulos ES y CommonJS**, con *tree-shaking*, compilada a ES2016: Node.js 20 o posterior y cualquier navegador actual.
- **Nunca lanza excepciones con lo que escribe el usuario.** Los validadores aceptan `unknown`: `null`, números y objetos dan `false` (o `NOT_A_STRING` en `validate()`). Solo `replaceNieLetter`, que está obsoleta, lanza excepciones con entradas incorrectas; los generadores lanzan un `RangeError` si las opciones son imposibles de cumplir, porque son errores de programación.
- **Normalización.** `" 12.345.678-z "`, `"x-0123456-7l"` y `"1234567L"` son válidos; `normalize()` da la forma que hay que guardar. `{ normalize: false }` desactiva la eliminación de separadores y el relleno con ceros; las minúsculas y la forma antigua del NIE se siguen aceptando.
- **Mensajes de error en 5 idiomas**: inglés (incluido), español, catalán (también para valenciano), euskera y gallego. Cada idioma se importa por separado, así que tu bundle solo lleva los que usas.
- **Generadores de datos de prueba** (`/generate`): números válidos con los caracteres de control de la propia biblioteca, iguales en cualquier plataforma para una misma semilla, y valores no válidos para cada código de error.
- **Adaptadores de esquemas** para Zod 4, Valibot 1 y Yup 1: devuelven el valor normalizado y dan el mensaje traducido, el código de error y la regla de SPEC.

## Resumen de la API

Todo lo que se exporta tiene JSDoc, así que tu editor muestra su documentación: un resumen y, en las funciones, qué significa cada parámetro y el valor devuelto, dos ejemplos que ejecutan los tests y un enlace a la regla de SPEC. La CI lo comprueba. El diseño y sus motivos están en [docs/api-design.md](docs/api-design.md) (en inglés); los cambios respecto a la v1, en [MIGRATION.md](MIGRATION.md).

### `validate()`: el resultado detallado

Sin `locale`, los mensajes y las descripciones se devuelven en inglés. Para obtenerlos en español, pasa `{ locale: es }`:

```ts
import { validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

validate(" b-1234567-4 ", { locale: es });
// { valid: true, type: "CIF", normalized: "B12345674",
//   meta: { orgKey: "B", orgDescription: "Sociedad de responsabilidad limitada" } }

validate("12345678A", { locale: es });
// { valid: false, type: "DNI", normalized: "12345678A",
//   error: { code: "INVALID_CONTROL_CHARACTER", rule: "DNI-2", expected: "Z",
//            message: "El carácter de control no es correcto: para este DNI debería ser «Z»." } }
```

| Campo | Valor |
| --- | --- |
| `valid` | `true` o `false`, con las opciones indicadas |
| `type` | `"DNI"`, `"NIE"`, `"CIF"`, `"NIF_KLM"` o `null` si el formato no se reconoce. Se rellena aunque el carácter de control esté mal, para que puedas decir «la letra de este DNI debería ser Z» |
| `normalized` | La forma canónica que hay que guardar (en mayúsculas, sin separadores, con el NIE antiguo abreviado y el DNI corto completado con ceros), o `null` |
| `error` | Solo si no es válido: `code`, `message` (en el idioma elegido), `rule` (el identificador de la regla en SPEC.md) y, si el carácter de control está mal, `expected` |
| `meta` | Solo para un CIF: `orgKey` y `orgDescription` (el tipo de organización, en el idioma elegido) |

Códigos de error y reglas que los producen:

| `error.code` | Cuándo | `error.rule` |
| --- | --- | --- |
| `NOT_A_STRING` | El valor no es una cadena | `INPUT-1` |
| `EMPTY` | Vacío o compuesto solo por espacios y separadores | `INPUT-2` |
| `INVALID_LENGTH` | No tiene 9 caracteres (10 en un NIE antiguo) | `DNI-1`, `KLM-1`, `NIE-1`, `NIE-3`, `CIF-1`, `VAT-1` |
| `INVALID_FORMAT` | Primer carácter incorrecto, letras donde van dígitos o un prefijo `ES` sin `allowVatPrefix` | `NIF-1`, `DNI-1`, `KLM-1`, `KLM-3`, `NIE-1`, `CIF-1`, `VAT-1` |
| `INVALID_CONTROL_CHARACTER` | Letra o dígito de control incorrecto; `expected` trae el correcto | `DNI-2`, `DNI-3`, `KLM-2`, `NIE-2`, `CIF-3`, `CIF-4` |
| `UNSUPPORTED_TYPE` | Un documento válido de un tipo que no está en `types` | `POLICY-2` |
| `PLACEHOLDER` | `00000000T`, `00000001R`, `99999999R` o `X0000000T` con `rejectPlaceholders` | `POLICY-1` |

### Opciones

| Opción | Por defecto | Efecto | La aceptan |
| --- | --- | --- | --- |
| `normalize` | `true` | Ignora espacios, puntos, guiones y barras, y completa con ceros un DNI corto (NORM-2 a NORM-4) | todas las funciones que validan, `getNifType()`, esquemas |
| `cifControl` | `"official"` | `"lenient"` también acepta una letra de control en las claves de CIF C D F G J U V, como la v1 (CIF-3) | todas las funciones que validan, esquemas |
| `rejectPlaceholders` | `false` | Rechaza los números de ejemplo (POLICY-1) | todas las funciones que validan, esquemas |
| `types` | todos los tipos | Acepta solo estos tipos (POLICY-2) | `validate()`, `zNif`, `vNif`, `yNif` |
| `allowVatPrefix` | `false` | Acepta también `ES` + NIF; `normalized` quita el `ES` (VAT-1) | `validate()`, `getNifType()`, esquemas salvo `*SpanishVat` |
| `locale` | inglés | El idioma de `error.message` y `meta.orgDescription` | `validate()`, esquemas |

```ts
import { isValidCif, validate } from "nif-dni-nie-cif-validation";

validate("B12345674", { types: ["DNI", "NIE"] }).error?.code;   // "UNSUPPORTED_TYPE"
validate("00000000T", { rejectPlaceholders: true }).error?.code; // "PLACEHOLDER"
validate("ES12345678Z", { allowVatPrefix: true }).normalized;    // "12345678Z"
isValidCif("G1234567D");                          // false: la G lleva un dígito (CIF-3)
isValidCif("G1234567D", { cifControl: "lenient" }); // true, como en la v1
```

### Validadores booleanos

```ts
import {
  isValidCif, isValidDni, isValidNaturalPersonNif, isValidNie, isValidNif, isValidSpanishVat,
} from "nif-dni-nie-cif-validation";

isValidNif("X1234567L");              // true: cualquier tipo
isValidNaturalPersonNif("B12345674"); // false: un CIF no es una persona física
isValidDni("K1234567L");              // true: DNI y NIF K/L/M
isValidNie("X01234567L");             // true: la forma antigua de 10 caracteres (NIE-3)
isValidCif("P2807900B");              // true: Ayuntamiento de Madrid
isValidSpanishVat("ES12345678Z");     // true: solo el formato, no consulta VIES
isValidNif(null);                     // false: nunca lanza excepciones
```

Son rápidos con la entrada canónica y en ese caso no reservan memoria. Con CommonJS:

```js
const { isValidNif } = require("nif-dni-nie-cif-validation");

isValidNif("12345678Z"); // true
```

### Utilidades

```ts
import {
  computeControlCharacter, describeCifOrganisation, format, getNifType, normalize,
} from "nif-dni-nie-cif-validation";

normalize(" x-0123456-7l ");             // "X1234567L"
format("12345678z");                     // "12345678-Z"
format("B12345674", { separator: " " }); // "B 1234567 4"
format("12345678A");                     // null: solo se formatean documentos válidos
getNifType("12345678A");                 // "DNI": solo el formato, la letra está mal
computeControlCharacter("B1234567");     // "4"
describeCifOrganisation("B");            // "Limited liability company"
```

### Idiomas

El inglés va incluido. Cada uno de los demás idiomas tiene su propio punto de entrada: importa el objeto y pásalo.

```ts
import { describeCifOrganisation, validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

validate("12345678A", { locale: es }).error?.message;
// "El carácter de control no es correcto: para este DNI debería ser «Z»."
describeCifOrganisation("B", es); // "Sociedad de responsabilidad limitada"
```

| Idioma | Importación |
| --- | --- |
| Inglés (por defecto) | `import { en } from "nif-dni-nie-cif-validation/locales/en"` |
| Español | `import { es } from "nif-dni-nie-cif-validation/locales/es"` |
| Catalán (català), también para valenciano (valencià) | `import { ca } from "nif-dni-nie-cif-validation/locales/ca"` |
| Euskera (euskara) | `import { eu } from "nif-dni-nie-cif-validation/locales/eu"` |
| Gallego (galego) | `import { gl } from "nif-dni-nie-cif-validation/locales/gl"` |

Pasa el objeto, no su código: una cadena como `"es"` se ignora y da inglés. Las fuentes de los nombres de las organizaciones están en [docs/translations.md](docs/translations.md).

### Generadores de datos de prueba

```ts
import {
  createGenerator, generateCif, generateDni, generateInvalid, generateNie, generateNif,
} from "nif-dni-nie-cif-validation/generate";

generateDni({ seed: 1 });                 // "62707394X": el mismo en cada ejecución y plataforma
generateDni({ seed: 1, kind: "K" });      // "K6270739L"
generateNie({ seed: 1, prefix: "Z" });    // "Z6270739R"
generateCif({ seed: 1, orgKey: "B" });    // "B62707393"
generateNif({ types: ["DNI", "NIE"] });   // un DNI o un NIE al azar (Math.random sin semilla)
generateInvalid("DNI", { seed: 1, reason: "INVALID_LENGTH" }); // "652707394X"

const gen = createGenerator(2024); // una secuencia: valores distintos, los mismos en cada ejecución
gen.dni() === gen.dni();           // false
```

Todos los generadores aceptan `format: true` para la forma de presentación. Los números válidos generados siguen SPEC.md y no figuran en la lista de valores de ejemplo de POLICY-1, pero son inventados: alguno puede coincidir por azar con el de una persona o empresa real, así que úsalos solo en tests. El punto de entrada principal nunca importa este módulo.

### Adaptadores de esquemas: Zod, Valibot, Yup

```ts
import { z } from "zod";
import { zNif } from "nif-dni-nie-cif-validation/zod";

const schema = z.object({ nif: zNif({ types: ["DNI", "NIE"] }) });

schema.parse({ nif: " 12.345.678-z " });        // { nif: "12345678Z" }
schema.safeParse({ nif: "B12345674" }).success; // false: aquí no se admite un CIF
```

```ts
import * as v from "valibot";
import { vNie } from "nif-dni-nie-cif-validation/valibot";

v.parse(vNie(), "x-0123456-7l"); // "X1234567L"
```

```ts
import { object } from "yup";
import { yCif } from "nif-dni-nie-cif-validation/yup";

await object({ cif: yCif() }).validate({ cif: "b-1234567-4" }); // { cif: "B12345674" }
```

| Biblioteca | Punto de entrada | Esquemas | Código y regla de un error |
| --- | --- | --- | --- |
| Zod 4 | `/zod` | `zNif`, `zDni`, `zNie`, `zCif`, `zSpanishVat` | los `params` del *issue*: `{ code, rule, expected? }` |
| Valibot 1 | `/valibot` | `vNif`, `vDni`, `vNie`, `vCif`, `vSpanishVat` | el propio *issue*: `issue.code`, `issue.rule`, `issue.expected` |
| Yup 1 | `/yup` | `yNif`, `yDni`, `yNie`, `yCif`, `ySpanishVat` | los `params` del `ValidationError` |

Cada esquema acepta las opciones de `validate()` y admite exactamente lo que admite `validate()`. Instala solo la biblioteca que uses; importar el núcleo nunca carga un adaptador. Más detalles en [docs/api-design.md](docs/api-design.md) (D12).

## Recetas

Cada receta, y más, es un proyecto ejecutable en [examples/](examples/): [Node, CommonJS](examples/node-cjs) y [módulos ES](examples/node-esm), [React Hook Form con Zod](examples/zod-react-hook-form) (Vite y React), [Express](examples/express-middleware), [Valibot](examples/valibot), [Yup](examples/yup), [fixtures de Vitest con los generadores](examples/generate-test-data), [validación masiva de un CSV, con su velocidad](examples/csv-bulk-validation), [Deno](examples/deno) y [Bun](examples/bun). La CI compila, comprueba los tipos o ejecuta cada uno contra el paquete empaquetado.

### Zod y React Hook Form

El esquema recibe el idioma del usuario y devuelve el valor normalizado:

```ts
// nif-schema.ts
import { z } from "zod";
import { es } from "nif-dni-nie-cif-validation/locales/es";
import { zNif } from "nif-dni-nie-cif-validation/zod";

export const schema = z.object({ nif: zNif({ types: ["DNI", "NIE"], locale: es }) });

schema.safeParse({ nif: "12345678A" }).error?.issues[0]?.message;
// "El carácter de control no es correcto: para este DNI debería ser «Z»."
```

`@hookform/resolvers` funciona con él tal cual, y `handleSubmit` recibe `"12345678Z"` para `" 12.345.678-z "`:

<!-- readme-test: skip (necesita react, react-hook-form y @hookform/resolvers, que no son dependencias de desarrollo; el esquema de arriba sí se prueba) -->
```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { schema } from "./nif-schema";

export function NifForm({ save }: { save: (nif: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.input<typeof schema>, unknown, z.output<typeof schema>
  >({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={handleSubmit(({ nif }) => save(nif))}>
      <input {...register("nif")} />
      {errors.nif && <p role="alert">{errors.nif.message}</p>}
    </form>
  );
}
```

### Middleware de Express

Rechaza la petición con un mensaje útil y pasa el NIF normalizado:

```ts
import { validate } from "nif-dni-nie-cif-validation";
import { es } from "nif-dni-nie-cif-validation/locales/es";

export function requireNif(
  req: { body: { nif?: unknown } },
  res: { status(code: number): { json(body: unknown): unknown } },
  next: () => void,
): void {
  const result = validate(req.body.nif, { locale: es });
  if (!result.valid) {
    res.status(400).json({ error: result.error }); // { code, message, rule, expected? }
    return;
  }
  req.body.nif = result.normalized; // "12345678Z", listo para guardar
  next();
}

// app.post("/customers", express.json(), requireNif, createCustomer);
```

### Generar datos de prueba

Genera NIF para tus fixtures sin copiar datos de personas reales ni escribir código propio para calcular la letra:

```ts
import { validate } from "nif-dni-nie-cif-validation";
import { createGenerator, generateInvalid } from "nif-dni-nie-cif-validation/generate";

const gen = createGenerator(42); // los mismos datos en cada ejecución
const customers = Array.from({ length: 3 }, (_, id) => ({ id, nif: gen.nif() }));

customers.every((customer) => validate(customer.nif).valid); // true
validate(generateInvalid("NIE", { seed: 7 })).error?.code;   // "INVALID_CONTROL_CHARACTER"
validate(generateInvalid("CIF", { seed: 7, reason: "INVALID_FORMAT" })).error?.code; // "INVALID_FORMAT"
```

### Mensajes en catalán

Elige los mensajes según el idioma del usuario, con el inglés como alternativa:

```ts
import { type NifLocale, validate } from "nif-dni-nie-cif-validation";
import { ca } from "nif-dni-nie-cif-validation/locales/ca";
import { en } from "nif-dni-nie-cif-validation/locales/en";
import { es } from "nif-dni-nie-cif-validation/locales/es";

const LOCALES: Record<string, NifLocale> = { ca, en, es };
const localeFor = (language: string) => LOCALES[language.slice(0, 2)] ?? en;
const locale = localeFor("ca-ES"); // por ejemplo, navigator.language

validate("12345678A", { locale }).error?.message;
// "El caràcter de control no és correcte: per a aquest DNI hauria de ser «Z»."
validate("B12345674", { locale }).meta?.orgDescription; // "Societat de responsabilitat limitada"
```

## DNI, NIE, NIF y CIF

- **NIF** (número de identificación fiscal) es el identificador fiscal de toda persona o entidad en España (RD 1065/2007). Todo lo que valida este paquete es un NIF.
- **DNI**: para los ciudadanos españoles, el NIF es el número del DNI: 8 dígitos y una letra de control, `12345678Z` ([DNI-1, DNI-2](SPEC.md#dni-1)).
- **NIE**: para los extranjeros, `X`, `Y` o `Z`, 7 dígitos y una letra de control, `X1234567L`. La forma antigua de 10 caracteres, `X0` seguido de 7 dígitos y una letra de control (`X01234567L`), sigue siendo válida ([NIE-1 a NIE-3](SPEC.md#nie-1)).
- **NIF K/L/M**: personas sin DNI ni NIE. K: españoles menores de 14 años residentes en España; L: españoles residentes en el extranjero; M: extranjeros sin NIE. Son personas físicas, no empresas ([KLM-1 a KLM-3](SPEC.md#klm-1)).
- **CIF**: hasta 2008, el nombre del NIF de las personas jurídicas y entidades; hoy oficialmente es el «NIF de persona jurídica o entidad». Una clave de organización, 7 dígitos y un carácter de control, `B12345674` ([CIF-1 a CIF-5](SPEC.md#cif-1)). El paquete mantiene el nombre `CIF` (`isValidCif`, `type: "CIF"`) porque es lo que la gente busca.
- **NIF-IVA**: `ES` seguido de un NIF (`ES12345678Z`, [VAT-1](SPEC.md#vat-1)). Que el formato sea válido no significa que el número esté dado de alta en VIES.

## Ley, guía oficial y convención

No todas las reglas que circulan por internet tienen una fuente oficial. [SPEC.md](SPEC.md) asigna a cada regla uno de cuatro niveles:

| Nivel | Fuente | Ejemplo |
| --- | --- | --- |
| T1: ley | Publicada en el BOE | Los formatos del DNI, el NIE, el NIF K/L/M y el CIF, y las claves de organización del CIF |
| T2: página oficial | Ministerio del Interior, AEAT | La letra de control del DNI (módulo 23), que no define ningún texto del BOE |
| T3: semioficial | La nota técnica interna de la AEAT | Qué claves de CIF llevan un dígito y cuáles una letra (CIF-3) |
| T4: convención | Práctica del sector, sin texto oficial | Aceptar minúsculas y separadores; el cálculo del control del CIF (CIF-4) |

Por defecto, solo T1 a T3 deciden qué es válido. Las convenciones T4 solo se aplican a la limpieza de la entrada (que nunca convierte en válido un documento que no lo es), con una excepción documentada: ningún texto oficial publica el cálculo del control del CIF, así que se usa el algoritmo universal, comprobado con NIF reales de organismos públicos ([CIF-4](SPEC.md#cif-4)). Todo lo demás es opcional: `cifControl: "lenient"` (el control del CIF con letra o dígito de la v1), `rejectPlaceholders`, `types` y `allowVatPrefix`. `normalize: false` desactiva la eliminación de separadores y el relleno con ceros (las minúsculas y la forma antigua del NIE se siguen aceptando). Las reglas que circulan sin fuente, como los códigos de provincia en un CIF o el prefijo `T`, figuran en SPEC.md como no implementadas.

## Rendimiento

<!-- bench:start -->
Medido con `pnpm bench:competitors` en un Apple M1 (8 núcleos, 16 GiB, darwin 25.3.0, arm64), con Node.js v24.16.0, el 2026-09-30, en el commit `3177752`. Todos los números de esta sección salen de [`bench/results/latest.json`](bench/results/latest.json) y los escribe `pnpm readme:bench`. Cómo se miden y sus limitaciones: [bench/README.md](bench/README.md) (en inglés). Resultados completos: [bench/results/latest.md](bench/results/latest.md).

#### Velocidad

Millones de validaciones por segundo (**M ops/s: cuanto mayor sea el valor, mayor será la velocidad**): la mediana de 3 rondas, cada biblioteca con sus opciones por defecto, con documentos válidos y no válidos en forma canónica (225 DNI, 150 NIE, 270 CIF). *no admitido*: la biblioteca no valida ese tipo. Los números absolutos dependen de la máquina; lo que se mantiene son las proporciones.

| Biblioteca | DNI | NIE | CIF |
| --- | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (esta versión) | **60,26** | **60,32** | **43,39** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 8,83 | 6,56 | 6,18 |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 7,53 | 4,20 | 4,53 |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 8,04 | 8,00 | *no admitido* |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 9,53 | 5,30 | *no admitido* |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 0,48 | 0,46 | 0,44 |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 6,65 | 4,26 | *no admitido* |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 4,71 | 3,72 | *no admitido* |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 9,69 | 7,84 | 6,79 |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 2,77 | 2,55 | 2,35 |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 2,71 | 2,15 | 2,77 |

Esta versión alcanza 6,8 veces (DNI), 9,2 veces (NIE) y 7,0 veces (CIF) la velocidad de la v1.0.11.
Ninguna otra biblioteca fue más rápida en ninguno de estos conjuntos.

#### Tamaño

Minificado y comprimido con gzip (**min+gzip: cuanto menor sea el valor, menor será el tamaño**): un validador de cada tipo, empaquetado con esbuild como hace `pnpm size`, y la biblioteca completa.

| Biblioteca | DNI | NIE | CIF | Cualquier tipo | Biblioteca completa |
| --- | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (esta versión) | **624 B** | **586 B** | **562 B** | **929 B** | **4653 B** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 1517 B | 1517 B | 1518 B | 1517 B | 1514 B |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 165 B | 237 B | 363 B | 583 B | 704 B |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 1135 B | 1135 B | *no admitido* | 1134 B | 1132 B |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 883 B | 882 B | *no admitido* | 882 B | 880 B |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 51 063 B | 51 063 B | 51 063 B | 51 063 B | 51 054 B |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 2539 B | 2539 B | *no admitido* | 2539 B | 44 449 B |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 6537 B | 6537 B | *no admitido* | 6537 B | 44 449 B |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 215 B | 243 B | 319 B | 456 B | 1189 B |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 533 B | 533 B | 533 B | 533 B | 746 B |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 1186 B | 1186 B | 1186 B | 1186 B | 5266 B |

Más pequeñas que esta versión para un validador de cualquier tipo: [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 (583 B), [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 (882 B), [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 (456 B) y [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 (533 B). Algunas de las bibliotecas más pequeñas validan menos tipos. Este paquete dedica bytes a normalizar la entrada (NORM-1 a NORM-4), a los tipos de control de CIF-3 y a los NIF K/L/M. Las bibliotecas publicadas solo como CommonJS no admiten *tree-shaking*, así que una función cuesta la biblioteca entera. Las bibliotecas de muchos países o de propósito general (stdnum, validator.js) son más grandes por diseño. También se ha medido [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6, con una importación directa de su módulo del NIF español (no documentada): 2468 B.

#### Coincidencia con SPEC.md

El porcentaje de los 117 casos de `test/fixtures` (opciones por defecto) que cada biblioteca juzga igual que SPEC.md, válidos o no válidos. **Es coincidencia con SPEC.md, no corrección absoluta**: los mantenedores de este paquete escribieron las reglas y los casos, así que el paquete coincide con ellos por construcción. Muchas discrepancias son decisiones que SPEC.md documenta (por ejemplo CIF-3, o aceptar la forma antigua del NIE); latest.md las enumera por biblioteca. «Entrada canónica» excluye los casos que necesitan normalización.

| Biblioteca | DNI | NIE | CIF | K/L/M | Todos | Entrada canónica |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **nif-dni-nie-cif-validation** (esta versión) | **100,0 %** | **100,0 %** | **100,0 %** | **100,0 %** | **100,0 %** | **100,0 %** |
| [nif-dni-nie-cif-validation](https://www.npmjs.com/package/nif-dni-nie-cif-validation) 1.0.11 | 72,4 % | 87,5 % | 82,8 % | 100,0 % | 82,9 % | 91,6 % |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | 89,7 % | 75,0 % | 86,2 % | 44,4 % | 82,9 % | 86,3 % |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | 72,4 % | 75,0 % | *no admitido* | 55,6 % | 72,9 % | 90,0 % |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | 75,9 % | 75,0 % | *no admitido* | 55,6 % | 74,6 % | 90,0 % |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | 89,7 % | 81,3 % | 62,1 % | 100,0 % | 75,2 % | 75,8 % |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 79,3 % | 75,0 % | *no admitido* | 55,6 % | 76,3 % | 90,0 % |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | 79,3 % | 75,0 % | *no admitido* | 100,0 % | 83,0 % | 100,0 % |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | 86,2 % | 75,0 % | 86,2 % | 55,6 % | 82,9 % | 87,4 % |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | 86,2 % | 75,0 % | 86,2 % | 55,6 % | 82,9 % | 87,4 % |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | 89,7 % | 81,3 % | 81,0 % | 100,0 % | 85,5 % | 88,4 % |
<!-- bench:end -->

## Comparación con otras bibliotecas

<!-- compare:start -->
Revisado el 2026-10-01, a partir del README, el package.json y la página de npm de cada biblioteca, y del benchmark de arriba (las versiones y los tamaños salen de latest.json).

| Biblioteca | Tipos | K/L/M | Normaliza la entrada | Objeto de resultado | Mensajes traducidos | Generadores de datos de prueba | Esquemas | Módulos | Tamaño, cualquier tipo (min+gzip) | Fecha de la última versión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **nif-dni-nie-cif-validation** (esta versión) | DNI, NIE, CIF, K/L/M | sí | sí | sí: código, regla de SPEC, mensaje | EN, ES, CA, EU, GL | sí | Zod, Valibot, Yup | ESM + CJS | 929 B | esta versión |
| [spain-id](https://www.npmjs.com/package/spain-id) 1.1.14 | DNI, NIE, CIF | no | parcial | no (solo el tipo) | no | no | no | ESM + CJS | 583 B | 2026-06-12 |
| [better-dni](https://www.npmjs.com/package/better-dni) 4.4.2 | DNI, NIE | no | `normalize()` aparte | no | no | sí | no | solo CJS / UMD | 1134 B | 2021-05-30 |
| [dni-js](https://www.npmjs.com/package/dni-js) 1.0.0 | DNI, NIE | no | parcial | no | no | no | no | solo CJS | 882 B | 2026-08-08 |
| [stdnum](https://www.npmjs.com/package/stdnum) 1.12.6 | DNI, NIE, CIF, K/L/M y unos 90 países | sí | sí | sí: clase de error | solo inglés | no | no | ESM + CJS | 51 063 B | 2026-08-01 |
| [validator.js `isIdentityCard(x, "ES")`](https://www.npmjs.com/package/validator) 13.15.35 | DNI, NIE | no | no | no | no | no | no | ESM (rutas internas) + CJS | 2539 B | 2026-04-02 |
| [validator.js `isTaxID(x, "es-ES")`](https://www.npmjs.com/package/validator) 13.15.35 | DNI, NIE, K/L/M | sí | no | no | no | no | no | ESM (rutas internas) + CJS | 6537 B | 2026-04-02 |
| [@maistik/validate-nif](https://www.npmjs.com/package/@maistik/validate-nif) 2.0.1 | DNI, NIE, CIF | no | parcial | parcial: `parse()`, sin el motivo | no | no | no | ESM + CJS | 456 B | 2026-06-14 |
| [@kreyo/nif-validator](https://www.npmjs.com/package/@kreyo/nif-validator) 0.1.0 | DNI, NIE, CIF | opcional | parcial | no | no | no | no | ESM + CJS | 533 B | 2026-04-29 |
| [jsvat](https://www.npmjs.com/package/jsvat) 2.5.4 | NIF-IVA de la UE (ES + NIF) | sí | sí | sí: validez y país | no | no | no | ESM + CJS | 1186 B | 2024-12-12, obsoleto |
<!-- compare:end -->

Si validas identificadores de muchos países, [stdnum](https://www.npmjs.com/package/stdnum) es una buena opción: cubre unos 90 países con una sola API, incluidos todos los tipos españoles. Este paquete se centra solo en España y llega más lejos: fuentes regla por regla, el motivo de cada error, mensajes traducidos, normalización, generadores y esquemas. Donde las bibliotecas no coinciden con SPEC.md, el benchmark cuenta las discrepancias de cada biblioteca, muestra algunas representativas e indica cuáles se deben a una decisión que SPEC.md documenta ([bench/results/latest.md](bench/results/latest.md), en inglés).

## Uso con agentes de programación con IA

El paquete incluye [`llms.txt`](llms.txt), una guía breve para asistentes de IA (funciones, ejemplos, códigos de error y trampas habituales), y [`llms-full.txt`](llms-full.txt), la referencia completa, ambos en inglés. Los dos van en el paquete de npm, así que un agente puede leerlos en `node_modules/nif-dni-nie-cif-validation/`. Puedes pegar esto en las instrucciones de tu agente:

```text
To validate Spanish NIF, DNI, NIE or CIF numbers, use the npm package
nif-dni-nie-cif-validation. Read node_modules/nif-dni-nie-cif-validation/llms.txt
before writing code. Use the isValid* functions for yes/no checks and validate()
when the user needs to know why a value is invalid, and store result.normalized.
For messages in another language, import the locale object from
nif-dni-nie-cif-validation/locales/<code> and pass it as { locale }.
For test data, use nif-dni-nie-cif-validation/generate instead of real numbers.
Don't write your own check-letter code.
```

Las reglas y sus fuentes oficiales están en [SPEC.md](SPEC.md). Los agentes que trabajan en este repositorio leen [AGENTS.md](AGENTS.md).

## Migración

### Desde la v1

La v2 sigue SPEC.md por defecto. [MIGRATION.md](MIGRATION.md) (en inglés) enumera cada cambio incompatible, con el código antes y después. En resumen: las claves de CIF C D F G J U V necesitan un dígito de control, la entrada se normaliza y TypeScript ya no acepta `ids.filter(isValidNif)`. Estas opciones dan exactamente los resultados de la v1.0.11:

```ts
import { isValidNif } from "nif-dni-nie-cif-validation";

isValidNif("G1234567D");                                           // false
isValidNif("G1234567D", { normalize: false, cifControl: "lenient" }); // true, como en la v1.0.11
```

### Desde otras bibliotecas

| Si usas | Usa en su lugar | Notas |
| --- | --- | --- |
| better-dni `isValid(x)` | `isValidNaturalPersonNif(x)` | También acepta NIF K/L/M, la forma antigua del NIE y separadores. `isValidNif` acepta además un CIF |
| better-dni `isNIF(x)`, `isNIE(x)` | `isValidDni(x)`, `isValidNie(x)` | |
| better-dni `ctrlChar(x)` | `computeControlCharacter(x)` | Pasa el número sin su carácter de control |
| better-dni `randomNIF()`, `randomNIE()` | `generateDni()`, `generateNie()` | De `/generate`; pasa `{ seed }` para obtener valores fijos |
| validator.js `isIdentityCard(x, "ES")`, `isTaxID(x, "es-ES")` | `isValidNaturalPersonNif(x)` | validator.js no comprueba CIF: usa `isValidCif(x)` o `isValidNif(x)`. Lanza una excepción si no recibe una cadena; este paquete devuelve `false` |
| spain-id `validateSpanishId(x)` | `isValidNif(x)` | También acepta NIF K/L/M. El control del CIF sigue CIF-3 (ver abajo) |
| spain-id `validDNI`, `validNIE`, `validCIF` | `isValidDni`, `isValidNie`, `isValidCif` | |
| spain-id `spainIdType(x)` | `getNifType(x)` | En mayúsculas: `"DNI"`, `"NIE"`, `"CIF"`, `"NIF_KLM"` o `null`. Como `spainIdType`, lee el formato y no comprueba el carácter de control |

Las bibliotecas que aceptan una letra o un dígito de control en cualquier clave de CIF aceptan algunos números que CIF-3 rechaza, como `G1234567D`. Si tus datos guardados los tienen, pasa `{ cifControl: "lenient" }` mientras los corriges.

## Contribuir, seguridad y licencia

- [CONTRIBUTING.md](CONTRIBUTING.md) (en inglés): instalación, comandos, convención de commits y publicación. Para cambiar una regla hace falta una fuente oficial: consulta «How to propose a change» en [SPEC.md](SPEC.md#how-to-propose-a-change).
- [SECURITY.md](SECURITY.md): cómo informar de una vulnerabilidad en privado.
- [Licencia MIT](LICENSE).

Si este paquete te ahorra tiempo, puedes apoyarlo:

<a href="https://www.buymeacoffee.com/josegoval" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>
