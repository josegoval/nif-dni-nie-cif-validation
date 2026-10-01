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
    copy: "Copia",
    copied: "Copiat",
  },
  validator: {
    heading: "Proveu-la",
    intro:
      "Escriviu o enganxeu un NIF, DNI, NIE o CIF. La mateixa biblioteca el comprova mentre escriviu i us diu per què no és vàlid.",
    label: "NIF, DNI, NIE o CIF",
    hint: "Podeu fer servir espais, punts, guionets i minúscules, com a 12.345.678-z.",
    generateLabel: "Genera un número aleatori",
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
        `${rules} regles, cadascuna amb un identificador (DNI-2, NIE-3, CIF-3…) i la seva font oficial a SPEC.md: el BOE, l'AEAT o una convenció identificada com a tal. Cada error indica la regla que no s'ha complert.`,
    },
    fast: {
      title: "Ràpida",
      headline: (speedup) =>
        `Com a mínim ${speedup} vegades el rendiment de qualsevol altra biblioteca provada`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s amb DNI (milions de validacions per segon; com més, més ràpida) i entre ${v1Low} i ${v1High} vegades més ràpida que la v1.`,
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
      generators: "Generadors",
    },
    comments: {
      normalized:
        "s'eliminen els espais, els punts i els guionets, i les minúscules passen a majúscules",
      wrongControl: "el dígit de control no és correcte",
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
      "Rendiment amb el conjunt de DNI, en milions de validacions per segon (M ops/s; com més, més ràpida), i mida d'un validador de qualsevol tipus (min+gzip; com menys, més petita).",
    caption:
      "Rendiment i mida de les biblioteques d'identificadors espanyols a npm",
    library: "Biblioteca",
    dni: "DNI, M ops/s",
    size: "Mida, qualsevol tipus",
    thisBuild: "aquesta versió",
    unsupported: "no disponible",
    more: "Rendiment i comparació complets",
    caveat:
      "Totes les xifres surten de bench/results/latest.json. La velocitat no ho és tot: la pàgina de rendiment també compara la concordança amb SPEC.md i les funcionalitats.",
  },
  footer: {
    label: "Enllaços del projecte",
    github: "GitHub",
    npm: "npm",
    license: "Llicència MIT",
    spec: "SPEC.md",
    coverage: "Cobertura de les proves",
    llms: "llms.txt",
    sponsor: "Doneu suport al projecte",
    madeBy: "Fet per josegoval.",
  },
};
