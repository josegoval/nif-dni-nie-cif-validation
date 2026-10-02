// Catalan (català): the texts of the site's components. See types.ts.
// Terminology as in the package's locale (src/locales/ca.ts) and
// docs/translations.md: "caràcter de control", "NIF d'entitat (CIF)",
// "xifra"; the reader is addressed with "vós" ("Introduïu"), like the locale.
import type { SiteStrings } from "./types";

export const ca: SiteStrings = {
  hero: {
    logoAlt:
      "nif-dni-nie-cif-validation: validació de NIF, DNI, NIE i CIF espanyols",
    installLabel: "Instal·lació amb npm",
    copy: "Copieu",
    copied: "Copiat",
  },
  validator: {
    heading: "Proveu-la",
    intro:
      "Escriviu o enganxeu un NIF, DNI, NIE o CIF. La mateixa biblioteca el comprova mentre escriviu i us diu per què no és vàlid.",
    label: "NIF, DNI, NIE o CIF",
    hint: "Podeu fer servir espais, punts, guionets i minúscules; per exemple, 12.345.678-z.",
    generateLabel: "Genereu un número aleatori",
    generate: {
      DNI: "DNI aleatori",
      NIE: "NIE aleatori",
      CIF: "CIF aleatori",
    },
    generatedNote:
      "Els números generats són ficticis i només serveixen per a proves: algun podria coincidir per casualitat amb el d'una persona o empresa real.",
    privacy:
      "S'executa del tot al vostre navegador: cap dada no surt del navegador.",
    noscript:
      "El validador en directe necessita JavaScript. La resta de la pàgina funciona sense.",
    ui: {
      empty: "El resultat apareix aquí mentre escriviu.",
      valid: "Vàlid",
      invalid: "No vàlid",
      type: "Tipus",
      normalized: "Valor normalitzat",
      control: "Caràcter de control",
      controlOk: "correcte",
      expected: "hauria de ser",
      rule: "Regla de SPEC",
      rulePassed: "es compleix",
      ruleFailed: "no es compleix",
      organisation: "Tipus d'entitat",
      none: "cap",
    },
  },
  why: {
    heading: "Per què aquesta biblioteca",
    correct: {
      title: "Correcta, amb fonts",
      body: (rules) =>
        `${rules} regles, cadascuna amb un identificador (DNI-2, NIE-3, CIF-3…) i la seva font documentada a SPEC.md: una font oficial (el BOE, l'AEAT), una convenció identificada com a tal o el contracte de la biblioteca. Cada error indica la regla que no s'ha complert.`,
    },
    fast: {
      title: "Ràpida",
      headline: (speedup) =>
        `Com a mínim ${speedup} vegades el rendiment de qualsevol altra biblioteca provada`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s amb DNI (milions de validacions per segon; com més alta és la xifra, més alt és el rendiment), amb un rendiment d'entre ${v1Low} i ${v1High} vegades el de la v1.`,
    },
    small: {
      title: "Petita",
      body: (anyBytes, fullKb) =>
        `${anyBytes} B min+gzip per a isValidNif i ${fullKb} kB per a tota la biblioteca. Admet tree shaking, i cada idioma s'importa per separat.`,
      note: (libraries) =>
        `Algunes biblioteques d'un sol propòsit ocupen menys per a un validador (${libraries}). Algunes validen menys tipus: aquesta dedica bytes a normalitzar l'entrada, als tipus de control de CIF-3 i als NIF K/L/M.`,
    },
    deps: {
      title: "0 dependències",
      body: "Cap dependència en temps d'execució. Zod, Valibot i Yup són dependències peer opcionals, que només necessiten els seus adaptadors.",
    },
    typed: {
      title: "Tipada",
      body: "Escrita en TypeScript, amb declaracions per a import i require. Mòduls ES i CommonJS, compilats a ES2016.",
    },
    safe: {
      title: "No llança mai excepcions",
      body: "Els validadors accepten unknown: null, números i objectes donen false, o NOT_A_STRING amb validate(). El que escrigui l'usuari no la fa fallar mai.",
    },
    languages: {
      title: "5 idiomes",
      body: "Missatges d'error i noms dels tipus d'entitat en anglès, castellà, català, basc i gallec. El validador d'aquí dalt parla l'idioma d'aquesta pàgina.",
    },
    tools: {
      title: "Generadors i esquemes",
      body: "Generadors de dades de prova amb llavor, i esquemes de Zod, Valibot i Yup que retornen el valor normalitzat i el missatge en el vostre idioma.",
    },
    measured: (machine, node, date) =>
      `Mesurat en un ${machine} amb Node.js ${node} el ${date}, cada biblioteca amb les opcions per defecte. Les proporcions entre biblioteques es mantenen millor d'una màquina a una altra que les xifres absolutes.`,
  },
  code: {
    heading: "Feu-la servir",
    intro:
      "Comprovacions booleanes per a un sí o un no, validate() quan necessiteu saber per què, i punts d'entrada opcionals per a esquemes i dades de prova.",
    tabsLabel: "Exemples de codi",
    tabs: {
      basic: "Bàsic",
      validate: "validate()",
      zod: "Zod",
      valibot: "Valibot",
      yup: "Yup",
      generators: "Generadors",
    },
    comments: {
      normalized:
        "s'eliminen els espais, els punts i els guionets, i les minúscules passen a majúscules",
      wrongControl: "la xifra de control no és correcta",
      neverThrows: "no llança mai excepcions",
      storeThis: "deseu aquest valor",
      cifRejected: "aquí no s'accepta cap CIF",
      sameEverywhere: "el mateix a cada execució i plataforma",
      stream:
        "una seqüència amb llavor: valors diferents, els mateixos a cada execució",
    },
  },
  compare: {
    heading: "Comparació",
    intro:
      "Rendiment amb el conjunt de DNI, en milions de validacions per segon (M ops/s; com més alta és la xifra, més alt és el rendiment), i mida d'un validador de qualsevol tipus (min+gzip; com més baixa és la xifra, més petita és la mida).",
    caption:
      "Rendiment i mida de les biblioteques d'identificadors espanyols a npm",
    library: "Biblioteca",
    dni: "DNI, M ops/s",
    size: "Mida, qualsevol tipus",
    thisBuild: "aquesta versió",
    unsupported: "no admès",
    more: "Rendiment i comparació complets",
    caveat:
      "Totes les xifres surten de bench/results/latest.json. La velocitat no ho és tot: la pàgina de rendiment enllaça els resultats complets, que també comparen la concordança amb SPEC.md i les funcionalitats.",
  },
  footer: {
    label: "Enllaços del projecte",
    github: "GitHub",
    npm: "npm",
    license: "Llicència MIT",
    spec: "Fonts oficials",
    coverage: "Cobertura de les proves",
    llms: "llms.txt",
    sponsor: "Doneu suport al projecte",
    madeBy: "Fet per josegoval.",
  },
  docs: {
    library: "Biblioteca",
    thisBuild: "aquesta versió",
    unsupported: "no admès",
    bytes: (formatted) => `${formatted} B`,
    cifKeys: {
      caption:
        "Les claus d'entitat del CIF, el tipus d'entitat que representa cadascuna i la classe de caràcter de control que porta",
      key: "Clau",
      organisation: "Tipus d'entitat",
      control: "Caràcter de control",
      digit: "una xifra",
      letter: "una lletra",
    },
    errors: {
      caption:
        "Tots els codis d'error de validate(), cada regla de SPEC que poden citar, una entrada que els produeix i el seu missatge en català",
      code: "Codi",
      rule: "Regla",
      example: "Exemple",
      message: "Missatge",
    },
    entryPoints: {
      caption: "Els punts d'entrada del paquet i què exporta cadascun",
      entryPoint: "Punt d'entrada",
      contents: "Què exporta",
      main: "Els validadors, validate(), normalize(), format(), getNifType(), computeControlCharacter(), describeCifOrganisation(), les constants de la v1 i els tipus. Inclou els missatges en anglès.",
      locale: (language) =>
        `L'objecte d'idioma en ${language}, que es passa com a locale a validate(), a describeCifOrganisation() i als esquemes.`,
      generate:
        "Generadors amb llavor de números vàlids i no vàlids, per a tests. El punt d'entrada principal no els importa mai.",
      schemas: (library) =>
        `Esquemes de ${library} per a tots els tipus i per al NIF-IVA. ${library.split(" ")[0]} és una dependència peer opcional.`,
      languages: {
        en: "anglès",
        es: "castellà",
        ca: "català (també per al valencià)",
        eu: "basc",
        gl: "gallec",
      },
    },
    apiFallback: {
      title: (module) => `${module}: referència de l'API`,
      description: (module) =>
        `Referència de l'API de ${module} (en anglès): signatures, opcions i exemples provats.`,
    },
    bench: {
      run: {
        caption: "On i com es va executar el benchmark",
        machine: "Màquina",
        cores: "Nuclis",
        memory: "Memòria",
        os: "Sistema operatiu",
        node: "Node.js",
        date: "Data",
        commit: "Commit mesurat",
        method: "Mètode",
        methodValue: (rounds, time, warmup) =>
          `${rounds} rondes; cada tasca, ${time} ms després de ${warmup} ms d'escalfament, en el seu propi procés; la xifra correspon a la mediana dels resultats de les rondes`,
      },
      throughput: {
        caption: (set, inputs) =>
          `${set}: milions de validacions per segon (M ops/s; com més alta és la xifra, més ràpida és) amb ${inputs} documents vàlids i no vàlids en forma canònica, i la proporció entre el rendiment d'aquesta versió i el de cada biblioteca`,
        ops: "M ops/s",
        speedup: "Rendiment relatiu",
        times: (value) => `${value}× el rendiment`,
        noneFaster: (set) =>
          `Cap altra biblioteca no va ser més ràpida amb el conjunt ${set}.`,
        faster: (set, libraries) =>
          `Més ràpides que aquesta versió amb el conjunt ${set}: ${libraries}.`,
      },
      size: {
        chartCaption:
          "Mida d'un validador de qualsevol tipus (min+gzip; com més baixa és la xifra, més petit és)",
        tableCaption:
          "Mida d'un validador de cada tipus i de la biblioteca sencera (min+gzip; com més baixa és la xifra, més petit és)",
        columns: {
          DNI: "DNI",
          NIE: "NIE",
          CIF: "CIF",
          any: "Qualsevol tipus",
          full: "Biblioteca sencera",
        },
        smaller: (libraries) =>
          `Més petites que aquesta versió per a un validador de qualsevol tipus: ${libraries}.`,
        noneSmaller:
          "Cap altra biblioteca no és més petita per a un validador de qualsevol tipus.",
        alternative: (library, bytes) =>
          `També s'ha mesurat ${library} amb una importació directa del seu mòdul del NIF espanyol (no documentada): ${bytes}.`,
      },
      agreement: {
        chartCaption:
          "Concordança amb SPEC.md (no correcció absoluta): el percentatge de casos que cada biblioteca jutja igual que SPEC.md, en tots els casos i, per separat, només en els casos amb entrada canònica",
        tableCaption:
          "Concordança amb SPEC.md per tipus de document, i les discrepàncies degudes a decisions que SPEC.md documenta",
        all: "Tots els casos",
        canonical: "Només entrada canònica",
        buckets: { DNI: "DNI", NIE: "NIE", CIF: "CIF", KLM: "K/L/M" },
        disagreements: "Discrepàncies",
        documented: "Per una decisió documentada",
      },
    },
    features: {
      caption:
        "Funcionalitats de les biblioteques d'identificadors espanyols a npm, amb les fonts amb què s'ha revisat cada fila",
      checkedOn: (date) =>
        `Revisat el ${date} amb el README, el package.json i la pàgina d'npm de cada biblioteca. Les versions i les mides surten dels resultats del benchmark.`,
      columns: {
        types: "Tipus",
        klm: "K/L/M",
        normalizes: "Normalitza l'entrada",
        result: "Objecte de resultat",
        messages: "Missatges traduïts",
        generators: "Generadors de dades de prova",
        schemas: "Esquemes",
        modules: "Mòduls",
        size: "Mida, qualsevol tipus (min+gzip)",
        released: "Última versió",
        sources: "Fonts",
      },
      phrases: {
        yes: "sí",
        no: "no",
        partial: "parcial",
        optIn: "opcional",
        separateNormalize: "normalize() a part",
        resultCodeRuleMessage: "sí: codi, regla de SPEC, missatge",
        resultTypeOnly: "no (només el tipus)",
        resultErrorClass: "sí: classe d'error",
        resultParseWithoutReason: "parcial: parse(), sense el motiu",
        resultValidityCountry: "sí: validesa i país",
        englishOnly: "només anglès",
        typesStdnum: "DNI, NIE, CIF, K/L/M i uns 90 països",
        typesJsvat: "NIF-IVA de la UE (ES + NIF)",
        cjsUmdOnly: "només CJS / UMD",
        cjsOnly: "només CJS",
        esmDeepImportsCjs: "ESM (rutes internes) + CJS",
        thisRelease: "aquesta versió",
        deprecatedOn: "{date}, obsoleta",
      },
      readme: "README",
      npm: "npm",
    },
    jsonLd: { docsName: "Documentació de nif-dni-nie-cif-validation" },
  },
};
