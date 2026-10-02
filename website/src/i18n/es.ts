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
    spec: "Fuentes oficiales",
    coverage: "Cobertura de tests",
    llms: "llms.txt",
    sponsor: "Apoya el proyecto",
    madeBy: "Hecho por josegoval.",
  },
  docs: {
    library: "Librería",
    thisBuild: "esta versión",
    unsupported: "no admitido",
    bytes: (formatted) => `${formatted} B`,
    cifKeys: {
      caption:
        "Las claves de entidad del CIF, el tipo de entidad que representa cada una y la clase de carácter de control que lleva",
      key: "Clave",
      organisation: "Tipo de entidad",
      control: "Carácter de control",
      digit: "un dígito",
      letter: "una letra",
    },
    errors: {
      caption:
        "Todos los códigos de error de validate(), cada regla de SPEC que pueden citar, una entrada que los produce y su mensaje en español",
      code: "Código",
      rule: "Regla",
      example: "Ejemplo",
      message: "Mensaje",
    },
    entryPoints: {
      caption: "Los puntos de entrada del paquete y qué exporta cada uno",
      entryPoint: "Punto de entrada",
      contents: "Qué exporta",
      main: "Los validadores, validate(), normalize(), format(), getNifType(), computeControlCharacter(), describeCifOrganisation(), las constantes de la v1 y los tipos. Incluye los mensajes en inglés.",
      locale: (language) =>
        `El objeto de idioma en ${language}, que se pasa como locale a validate(), a describeCifOrganisation() y a los esquemas.`,
      generate:
        "Generadores con semilla de números válidos y no válidos, para tests. El punto de entrada principal nunca los importa.",
      schemas: (library) =>
        `Esquemas de ${library} para todos los tipos y para el NIF-IVA. ${library.split(" ")[0]} es una dependencia peer opcional.`,
      languages: {
        en: "inglés",
        es: "español",
        ca: "catalán (también para el valenciano)",
        eu: "euskera",
        gl: "gallego",
      },
    },
    apiFallback: {
      title: (module) => `${module}: referencia de la API`,
      description: (module) =>
        `Referencia de la API de ${module} (en inglés): firmas, opciones y ejemplos probados.`,
    },
    bench: {
      run: {
        caption: "Dónde y cómo se ejecutó el benchmark",
        machine: "Máquina",
        cores: "Núcleos",
        memory: "Memoria",
        os: "Sistema operativo",
        node: "Node.js",
        date: "Fecha",
        commit: "Commit medido",
        method: "Método",
        methodValue: (rounds, time, warmup) =>
          `${rounds} rondas; cada tarea, ${time} ms tras ${warmup} ms de calentamiento, en su propio proceso; la cifra es la de la ronda mediana`,
      },
      throughput: {
        caption: (set, inputs) =>
          `${set}: millones de validaciones por segundo (M ops/s; cuanto mayor sea la cifra, más rápida es) con ${inputs} documentos válidos y no válidos en forma canónica, y la proporción entre el rendimiento de esta versión y el de cada librería`,
        ops: "M ops/s",
        speedup: "Rendimiento relativo",
        times: (value) => `${value}× el rendimiento`,
        noneFaster: (set) =>
          `Ninguna otra librería fue más rápida con el conjunto ${set}.`,
        faster: (set, libraries) =>
          `Más rápidas que esta versión con el conjunto ${set}: ${libraries}.`,
      },
      size: {
        chartCaption:
          "Tamaño de un validador de cualquier tipo (min+gzip; cuanto menor sea la cifra, más pequeño es)",
        tableCaption:
          "Tamaño de un validador de cada tipo y de la librería completa (min+gzip; cuanto menor sea la cifra, más pequeño es)",
        columns: {
          DNI: "DNI",
          NIE: "NIE",
          CIF: "CIF",
          any: "Cualquier tipo",
          full: "Librería completa",
        },
        smaller: (libraries) =>
          `Más pequeñas que esta versión para un validador de cualquier tipo: ${libraries}.`,
        noneSmaller:
          "Ninguna otra librería es más pequeña para un validador de cualquier tipo.",
        alternative: (library, bytes) =>
          `También se ha medido ${library} con una importación directa de su módulo del NIF español (no documentada): ${bytes}.`,
      },
      agreement: {
        chartCaption:
          "Concordancia con SPEC.md (no corrección absoluta): el porcentaje de casos que cada librería juzga igual que SPEC.md, en todos ellos y solo en la entrada canónica",
        tableCaption:
          "Concordancia con SPEC.md por tipo de documento, y las discrepancias debidas a decisiones que SPEC.md documenta",
        all: "Todos los casos",
        canonical: "Solo entrada canónica",
        buckets: { DNI: "DNI", NIE: "NIE", CIF: "CIF", KLM: "K/L/M" },
        disagreements: "Discrepancias",
        documented: "Por una decisión documentada",
      },
    },
    features: {
      caption:
        "Funcionalidades de las librerías de identificadores españoles en npm, con las fuentes con que se revisó cada fila",
      checkedOn: (date) =>
        `Revisado el ${date} con el README, el package.json y la página de npm de cada librería. Las versiones y los tamaños salen de los resultados del benchmark.`,
      columns: {
        types: "Tipos",
        klm: "K/L/M",
        normalizes: "Normaliza la entrada",
        result: "Objeto de resultado",
        messages: "Mensajes traducidos",
        generators: "Generadores de datos de prueba",
        schemas: "Esquemas",
        modules: "Módulos",
        size: "Tamaño, cualquier tipo (min+gzip)",
        released: "Última versión",
        sources: "Fuentes",
      },
      phrases: {
        yes: "sí",
        no: "no",
        partial: "parcial",
        optIn: "opcional",
        separateNormalize: "normalize() aparte",
        resultCodeRuleMessage: "sí: código, regla de SPEC, mensaje",
        resultTypeOnly: "no (solo el tipo)",
        resultErrorClass: "sí: clase de error",
        resultParseWithoutReason: "parcial: parse(), sin el motivo",
        resultValidityCountry: "sí: validez y país",
        englishOnly: "solo inglés",
        typesStdnum: "DNI, NIE, CIF, K/L/M y unos 90 países",
        typesJsvat: "NIF-IVA de la UE (ES + NIF)",
        cjsUmdOnly: "solo CJS / UMD",
        cjsOnly: "solo CJS",
        esmDeepImportsCjs: "ESM (rutas internas) + CJS",
        thisRelease: "esta versión",
        deprecatedOn: "{date}, obsoleta",
      },
      readme: "README",
      npm: "npm",
    },
    jsonLd: { docsName: "Documentación de nif-dni-nie-cif-validation" },
  },
};
