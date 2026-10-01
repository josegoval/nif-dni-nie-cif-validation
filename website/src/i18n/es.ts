// Spanish (español): the texts of the site's components. See types.ts.
// Terminology as in the package's locale (src/locales/es.ts) and
// docs/translations.md: "carácter de control", "NIF de persona jurídica o
// entidad (antes CIF)"; informal "tú", as most Spanish web forms use.
import type { SiteStrings } from "./types";

export const es: SiteStrings = {
  hero: {
    logoAlt:
      "nif-dni-nie-cif-validation: validación de NIF, DNI, NIE y CIF españoles",
    installLabel: "Instalar con npm",
    copy: "Copiar",
    copied: "Copiado",
  },
  validator: {
    heading: "Pruébalo",
    intro:
      "Escribe o pega un NIF, DNI, NIE o CIF. La propia librería lo comprueba mientras escribes y te dice por qué no es válido.",
    label: "NIF, DNI, NIE o CIF",
    hint: "Puedes usar espacios, puntos, guiones y minúsculas, como en 12.345.678-z.",
    generateLabel: "Generar un número aleatorio",
    generate: {
      DNI: "DNI aleatorio",
      NIE: "NIE aleatorio",
      CIF: "CIF aleatorio",
    },
    generatedNote:
      "Los números generados son ficticios y solo sirven para tests: alguno podría coincidir por casualidad con el de una persona o empresa real.",
    privacy: "Se ejecuta por completo en tu navegador: ningún dato sale de él.",
    noscript:
      "El validador en vivo necesita JavaScript. El resto de la página funciona sin él.",
    ui: {
      empty: "El resultado aparece aquí mientras escribes.",
      valid: "Válido",
      invalid: "No válido",
      type: "Tipo",
      normalized: "Valor normalizado",
      control: "Carácter de control",
      controlOk: "correcto",
      expected: "debería ser",
      rule: "Regla de SPEC",
      rulePassed: "se cumple",
      ruleFailed: "no se cumple",
      organisation: "Tipo de entidad",
      none: "ninguno",
    },
  },
  why: {
    heading: "Por qué esta librería",
    correct: {
      title: "Correcta, con fuentes",
      body: (rules) =>
        `${rules} reglas, cada una con un identificador (DNI-2, NIE-3, CIF-3…) y su fundamento documentado en SPEC.md: una fuente oficial, una convención identificada como tal o el contrato de la librería. Cada error indica la regla que ha fallado.`,
    },
    fast: {
      title: "Rápida",
      headline: (speedup) =>
        `Al menos ${speedup} veces el rendimiento de cualquier otra librería probada`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s con DNI (millones de validaciones por segundo; cuanto mayor sea la cifra, mayor es el rendimiento) y un rendimiento entre ${v1Low} y ${v1High} veces el de la v1.`,
    },
    small: {
      title: "Pequeña",
      body: (anyBytes, fullKb) =>
        `${anyBytes} B min+gzip para isValidNif y ${fullKb} kB para toda la librería. Admite tree shaking, y cada idioma se importa por separado.`,
      note: (libraries) =>
        `Algunas librerías de un solo propósito ocupan menos para un validador (${libraries}). Algunas validan menos tipos: esta dedica bytes a normalizar la entrada, a los tipos de control de CIF-3 y a los NIF K/L/M.`,
    },
    deps: {
      title: "0 dependencias",
      body: "Sin dependencias en tiempo de ejecución. Zod, Valibot y Yup son dependencias peer opcionales, que solo necesitan sus adaptadores.",
    },
    typed: {
      title: "Tipada",
      body: "Escrita en TypeScript, con declaraciones para import y require. Módulos ES y CommonJS, compilados a ES2016.",
    },
    safe: {
      title: "Nunca lanza excepciones",
      body: "Los validadores aceptan unknown: null, números y objetos dan false, o NOT_A_STRING con validate(). Lo que escriba el usuario nunca la rompe.",
    },
    languages: {
      title: "5 idiomas",
      body: "Mensajes de error y nombres de tipos de entidad en inglés, español, catalán, euskera y gallego. El validador de arriba habla el idioma de esta página.",
    },
    tools: {
      title: "Generadores y esquemas",
      body: "Generadores de datos de prueba con semilla, y esquemas de Zod, Valibot y Yup que devuelven el valor normalizado y el mensaje en tu idioma.",
    },
    measured: (machine, node, date) =>
      `Medido en un ${machine} con Node.js ${node} el ${date}, cada librería con sus opciones por defecto. Las proporciones entre librerías se mantienen mejor de una máquina a otra que las cifras absolutas.`,
  },
  code: {
    heading: "Úsala",
    intro:
      "Comprobaciones booleanas para un sí o un no, validate() cuando necesitas saber por qué, y puntos de entrada opcionales para esquemas y datos de prueba.",
    tabsLabel: "Ejemplos de código",
    tabs: {
      basic: "Básico",
      validate: "validate()",
      zod: "Zod",
      valibot: "Valibot",
      yup: "Yup",
      generators: "Generadores",
    },
    comments: {
      normalized:
        "se eliminan espacios, puntos y guiones, y se convierten las minúsculas en mayúsculas",
      wrongControl: "el dígito de control no es correcto",
      neverThrows: "nunca lanza excepciones",
      storeThis: "guarda este valor",
      cifRejected: "aquí no se acepta un CIF",
      sameEverywhere: "el mismo en cada ejecución y plataforma",
      stream:
        "una secuencia con semilla: valores distintos, los mismos en cada ejecución",
    },
  },
  compare: {
    heading: "Comparación",
    intro:
      "Rendimiento con el conjunto de DNI, en millones de validaciones por segundo (M ops/s; cuanto mayor sea la cifra, mayor es el rendimiento), y tamaño de un validador de cualquier tipo (min+gzip; cuanto menor sea la cifra, menor es el tamaño).",
    caption:
      "Rendimiento y tamaño de las librerías de identificadores españoles en npm",
    library: "Librería",
    dni: "DNI, M ops/s",
    size: "Tamaño, cualquier tipo",
    thisBuild: "esta versión",
    unsupported: "no admitido",
    more: "Rendimiento y comparación completos",
    caveat:
      "Todas las cifras salen de bench/results/latest.json. La velocidad no lo es todo: la página de rendimiento enlaza los resultados completos, que también comparan la concordancia con SPEC.md y las funcionalidades.",
  },
  footer: {
    label: "Enlaces del proyecto",
    github: "GitHub",
    npm: "npm",
    license: "Licencia MIT",
    spec: "SPEC.md",
    coverage: "Cobertura de tests",
    llms: "llms.txt",
    sponsor: "Apoya el proyecto",
    madeBy: "Hecho por josegoval.",
  },
};
