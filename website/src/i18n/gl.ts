// Galician (galego): the texts of the site's components. See types.ts.
// Terminology as in the package's locale (src/locales/gl.ts) and
// docs/translations.md: "carácter de control", "NIF de entidade (CIF)",
// "díxito"; the reader is addressed formally ("Introduza"), like the locale.
import type { SiteStrings } from "./types";

export const gl: SiteStrings = {
  hero: {
    logoAlt:
      "nif-dni-nie-cif-validation: validación de NIF, DNI, NIE e CIF españois",
    installLabel: "Instalación con npm",
    copy: "Copiar",
    copied: "Copiado",
  },
  validator: {
    heading: "Próbea",
    intro:
      "Escriba ou pegue un NIF, DNI, NIE ou CIF. A propia biblioteca compróbao mentres escribe e indícalle por que non é válido.",
    label: "NIF, DNI, NIE ou CIF",
    hint: "Pode usar espazos, puntos, guións e minúsculas, como en 12.345.678-z.",
    generateLabel: "Xerar un número aleatorio",
    generate: {
      DNI: "DNI aleatorio",
      NIE: "NIE aleatorio",
      CIF: "CIF aleatorio",
    },
    generatedNote:
      "Os números xerados son ficticios e só serven para probas: algún podería coincidir por casualidade co dunha persoa ou empresa real.",
    privacy:
      "Execútase por completo no seu navegador: ningún dato sae do navegador.",
    noscript:
      "O validador en directo necesita JavaScript. O resto da páxina funciona sen el.",
    ui: {
      empty: "O resultado aparece aquí mentres escribe.",
      valid: "Válido",
      invalid: "Non válido",
      type: "Tipo",
      normalized: "Valor normalizado",
      control: "Carácter de control",
      controlOk: "correcto",
      expected: "debería ser",
      rule: "Regra de SPEC",
      rulePassed: "cúmprese",
      ruleFailed: "non se cumpre",
      organisation: "Tipo de entidade",
      none: "ningún",
    },
  },
  why: {
    heading: "Por que esta biblioteca",
    correct: {
      title: "Correcta, con fontes",
      body: (rules) =>
        `${rules} regras, cada unha cun identificador (DNI-2, NIE-3, CIF-3…) e a súa fonte en SPEC.md: o BOE, a AEAT, unha convención identificada como tal ou o contrato da biblioteca. Cada erro indica a regra que non se cumpriu.`,
    },
    fast: {
      title: "Rápida",
      headline: (speedup) =>
        `Polo menos ${speedup} veces o rendemento de calquera outra biblioteca probada`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s con DNI (millóns de validacións por segundo; canto maior sexa a cifra, maior será o rendemento), cun rendemento de entre ${v1Low} e ${v1High} veces o da v1.`,
    },
    small: {
      title: "Pequena",
      body: (anyBytes, fullKb) =>
        `${anyBytes} B min+gzip para isValidNif e ${fullKb} kB para toda a biblioteca. Admite tree shaking, e cada idioma impórtase por separado.`,
      note: (libraries) =>
        `Algunhas bibliotecas dun só propósito ocupan menos para un validador (${libraries}). Algunhas validan menos tipos: esta dedica bytes a normalizar a entrada, aos tipos de control de CIF-3 e aos NIF K/L/M.`,
    },
    deps: {
      title: "0 dependencias",
      body: "Sen dependencias en tempo de execución. Zod, Valibot e Yup son dependencias peer opcionais, que só necesitan os seus adaptadores.",
    },
    typed: {
      title: "Tipada",
      body: "Escrita en TypeScript, con declaracións para import e require. Módulos ES e CommonJS, compilados a ES2016.",
    },
    safe: {
      title: "Nunca lanza excepcións",
      body: "Os validadores aceptan unknown: null, números e obxectos dan false, ou NOT_A_STRING con validate(). O que escriba a persoa usuaria nunca a fai fallar.",
    },
    languages: {
      title: "5 idiomas",
      body: "Mensaxes de erro e nomes dos tipos de entidade en inglés, castelán, catalán, éuscaro e galego. O validador de arriba fala o idioma desta páxina.",
    },
    tools: {
      title: "Xeradores e esquemas",
      body: "Xeradores de datos de proba con semente, e esquemas de Zod, Valibot e Yup que devolven o valor normalizado e a mensaxe no seu idioma.",
    },
    measured: (machine, node, date) =>
      `Medido nun ${machine} con Node.js ${node} o ${date}, cada biblioteca coas súas opcións predeterminadas. As proporcións entre bibliotecas mantéñense mellor dunha máquina a outra ca as cifras absolutas.`,
  },
  code: {
    heading: "Úsea",
    intro:
      "Comprobacións booleanas para un si ou un non, validate() cando precise saber por que, e puntos de entrada opcionais para esquemas e datos de proba.",
    tabsLabel: "Exemplos de código",
    tabs: {
      basic: "Básico",
      validate: "validate()",
      zod: "Zod",
      generators: "Xeradores",
    },
    comments: {
      normalized:
        "elimínanse os espazos, os puntos e os guións, e as minúsculas pasan a maiúsculas",
      wrongControl: "o díxito de control non é correcto",
      neverThrows: "nunca lanza excepcións",
      storeThis: "garde este valor",
      cifRejected: "aquí non se acepta ningún CIF",
      sameEverywhere: "o mesmo en cada execución e plataforma",
      stream:
        "unha secuencia con semente: valores distintos, os mesmos en cada execución",
    },
  },
  compare: {
    heading: "Comparación",
    intro:
      "Rendemento co conxunto de DNI, en millóns de validacións por segundo (M ops/s; canto maior sexa a cifra, maior será o rendemento), e tamaño dun validador de calquera tipo (min+gzip; canto menor sexa a cifra, menor será o tamaño).",
    caption:
      "Rendemento e tamaño das bibliotecas de identificadores españois en npm",
    library: "Biblioteca",
    dni: "DNI, M ops/s",
    size: "Tamaño, calquera tipo",
    thisBuild: "esta compilación",
    unsupported: "non compatible",
    more: "Rendemento e comparación completos",
    caveat:
      "Todas as cifras saen de bench/results/latest.json. A velocidade non o é todo: a páxina de rendemento inclúe ligazóns aos resultados completos, que tamén comparan a concordancia con SPEC.md e as funcionalidades.",
  },
  footer: {
    label: "Ligazóns do proxecto",
    github: "GitHub",
    npm: "npm",
    license: "Licenza MIT",
    spec: "SPEC.md",
    coverage: "Cobertura das probas",
    llms: "llms.txt",
    sponsor: "Apoie o proxecto",
    madeBy: "Feito por josegoval.",
  },
};
