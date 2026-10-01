// Basque (euskara): the texts of the site's components. See types.ts.
// Terminology as in the package's locale (src/locales/eu.ts) and
// docs/translations.md: the Basque names of the documents, "IFZ" (NIF),
// "NAN" (DNI), "AIZ" (NIE), "IFK" (the old CIF), and "kontrol-karakterea";
// bare imperative for instructions ("Idatzi"), as Basque software does.
import type { SiteStrings } from "./types";

export const eu: SiteStrings = {
  hero: {
    logoAlt:
      "nif-dni-nie-cif-validation: Espainiako IFZ, NAN, AIZ eta IFK zenbakien egiaztapena",
    installLabel: "Instalatu npm bidez",
    copy: "Kopiatu",
    copied: "Kopiatuta",
  },
  validator: {
    heading: "Probatu",
    intro:
      "Idatzi edo itsatsi IFZ, NAN, AIZ edo IFK bat. Liburutegiak berak egiaztatzen du idatzi ahala, eta zergatik ez den baliozkoa esaten dizu.",
    label: "IFZ, NAN, AIZ edo IFK",
    hint: "Zuriuneak, puntuak, marrak eta minuskulak erabil ditzakezu; adibidez, 12.345.678-z.",
    generateLabel: "Sortu ausazko zenbaki bat",
    generate: {
      DNI: "Ausazko NANa",
      NIE: "Ausazko AIZa",
      CIF: "Ausazko IFKa",
    },
    generatedNote:
      "Sortutako zenbakiak asmatuak dira, eta probetarako bakarrik balio dute: baliteke kasualitatez benetako pertsona edo enpresa batenarekin bat etortzea.",
    privacy:
      "Osorik zure nabigatzailean exekutatzen da: daturik ez da nabigatzailetik ateratzen.",
    noscript:
      "Zuzeneko egiaztatzaileak JavaScript behar du. Orriaren gainerako guztiak hura gabe funtzionatzen du.",
    ui: {
      empty: "Emaitza hemen agertuko da, idatzi ahala.",
      valid: "Baliozkoa",
      invalid: "Ez da baliozkoa",
      type: "Mota",
      normalized: "Balio normalizatua",
      control: "Kontrol-karakterea",
      controlOk: "zuzena",
      expected: "hau izan beharko luke:",
      rule: "SPEC araua",
      rulePassed: "betetzen da",
      ruleFailed: "ez da betetzen",
      organisation: "Erakunde mota",
      none: "ez dago",
    },
  },
  why: {
    heading: "Zergatik liburutegi hau",
    correct: {
      title: "Zuzena, iturriekin",
      body: (rules) =>
        `${rules} arau, bakoitza bere identifikatzailearekin (DNI-2, NIE-3, CIF-3…) eta SPEC.md fitxategian dokumentatutako iturriarekin: iturri ofizial bat (BOE, AEAT), hala identifikatutako konbentzio bat edo liburutegiaren kontratua. Errore bakoitzak zein arau ez den bete adierazten du.`,
    },
    fast: {
      title: "Azkarra",
      headline: (speedup) =>
        `Probatutako beste edozein liburutegiren errendimenduaren ${speedup} halakoa, gutxienez`,
      body: (mops, v1Low, v1High) =>
        `${mops} M ops/s NAN zenbakiekin (milioi egiaztapen segundoko; zenbat eta gehiago, orduan eta azkarragoa), eta v1-ekiko errendimendu-ratioa ${v1Low}–${v1High} da.`,
    },
    small: {
      title: "Txikia",
      body: (anyBytes, fullKb) =>
        `${anyBytes} B min+gzip isValidNif funtzioarentzat, eta ${fullKb} kB liburutegi osoarentzat. Tree shaking onartzen du, eta hizkuntza bakoitza bere aldetik inportatzen da.`,
      note: (libraries) =>
        `Helburu bakarreko liburutegi batzuk txikiagoak dira egiaztatzaile bakar baterako (${libraries}). Horietako batzuek mota gutxiago egiaztatzen dituzte: liburutegi honek sarrera normalizatzeko, CIF-3 arauko kontrol motetarako eta K/L/M IFZetarako erabiltzen ditu byteak.`,
    },
    deps: {
      title: "0 mendekotasun",
      body: "Ez du exekuzio-garaiko mendekotasunik. Zod, Valibot eta Yup aukerako peer mendekotasunak dira, eta haien egokitzaileek bakarrik behar dituzte.",
    },
    typed: {
      title: "Tipatua",
      body: "TypeScript-en idatzia, import eta require erabiltzeko deklarazioekin. ES moduluak eta CommonJS, ES2016ra konpilatuta.",
    },
    safe: {
      title: "Ez du inoiz salbuespenik jaurtitzen",
      body: "Egiaztatzaileek unknown motako balioak onartzen dituzte: null, zenbaki edo objektu bat jasotzean, false itzultzen dute; validate() funtzioak, berriz, NOT_A_STRING errorea itzultzen du. Erabiltzailearen sarrerak ez du inoiz hutsik eragiten.",
    },
    languages: {
      title: "5 hizkuntza",
      body: "Errore-mezuak eta erakunde moten izenak ingelesez, gaztelaniaz, katalanez, euskaraz eta galegoz. Goiko egiaztatzaileak orri honen hizkuntza erabiltzen du.",
    },
    tools: {
      title: "Sorgailuak eta eskemak",
      body: "Hazidun proba-datuen sorgailuak, eta balio normalizatua eta mezua zure hizkuntzan itzultzen dituzten Zod, Valibot eta Yup eskemak.",
    },
    measured: (machine, node, date) =>
      `Neurketa: ${machine}, Node.js ${node}, ${date}; liburutegi bakoitza bere aukera lehenetsiekin. Liburutegien arteko proportzioak zenbaki absolutuak baino hobeto mantentzen dira makina batetik bestera.`,
  },
  code: {
    heading: "Erabili",
    intro:
      "Egiaztapen boolearrak bai edo ez jakiteko, validate() zergatia jakin behar duzunean, eta aukerako sarrera-puntuak eskemetarako eta proba-datuetarako.",
    tabsLabel: "Kode-adibideak",
    tabs: {
      basic: "Oinarrizkoa",
      validate: "validate()",
      zod: "Zod",
      generators: "Sorgailuak",
    },
    comments: {
      normalized:
        "zuriuneak, puntuak eta marrak kentzen dira, eta minuskulak maiuskula bihurtzen dira",
      wrongControl: "kontrol-digitua ez da zuzena",
      neverThrows: "ez du inoiz salbuespenik jaurtitzen",
      storeThis: "gorde balio hau",
      cifRejected: "hemen ez da IFKrik onartzen",
      sameEverywhere: "berbera exekuzio eta plataforma guztietan",
      stream:
        "hazidun sekuentzia bat: balio desberdinak, berberak exekuzio bakoitzean",
    },
  },
  compare: {
    heading: "Konparazioa",
    intro:
      "Errendimendua NAN multzoan, milioi egiaztapen segundoko (M ops/s; zenbat eta gehiago, orduan eta azkarragoa), eta edozein motatako egiaztatzaile baten tamaina (min+gzip; zenbat eta gutxiago, orduan eta txikiagoa).",
    caption:
      "npm-ko Espainiako identifikatzaileen liburutegien errendimendua eta tamaina",
    library: "Liburutegia",
    dni: "NAN, M ops/s",
    size: "Tamaina, edozein mota",
    thisBuild: "konpilazio hau",
    unsupported: "ez da onartzen",
    more: "Errendimendua eta konparazioa, osorik",
    caveat:
      "Zenbaki guztiak bench/results/latest.json fitxategitik datoz. Abiadura ez da dena: errendimenduaren orriak emaitza osoetarako esteka du, eta emaitza horiek SPEC.md fitxategiarekiko adostasuna eta ezaugarriak ere konparatzen dituzte.",
  },
  footer: {
    label: "Proiektuaren estekak",
    github: "GitHub",
    npm: "npm",
    license: "MIT lizentzia",
    spec: "SPEC.md",
    coverage: "Proben estaldura",
    llms: "llms.txt",
    sponsor: "Lagundu proiektuari",
    madeBy: "Egilea: josegoval.",
  },
};
