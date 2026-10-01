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
    spec: "Iturri ofizialak",
    coverage: "Proben estaldura",
    llms: "llms.txt",
    sponsor: "Lagundu proiektuari",
    madeBy: "Egilea: josegoval.",
  },
  docs: {
    library: "Liburutegia",
    thisBuild: "konpilazio hau",
    unsupported: "ez da onartzen",
    bytes: (formatted) => `${formatted} B`,
    cifKeys: {
      caption:
        "IFKaren erakunde-gakoak, bakoitzak adierazten duen erakunde mota eta daraman kontrol-karaktere mota",
      key: "Gakoa",
      organisation: "Erakunde mota",
      control: "Kontrol-karakterea",
      digit: "digitu bat",
      letter: "letra bat",
    },
    errors: {
      caption:
        "validate() funtzioaren errore-kode guztiak, bakoitzak aipa dezakeen SPEC arau bakoitza, errore hori ematen duen sarrera bat eta haren mezua euskaraz",
      code: "Kodea",
      rule: "Araua",
      example: "Adibidea",
      message: "Mezua",
    },
    entryPoints: {
      caption: "Paketearen sarrera-puntuak, eta bakoitzak zer esportatzen duen",
      entryPoint: "Sarrera-puntua",
      contents: "Zer esportatzen duen",
      main: "Egiaztatzaileak, validate(), normalize(), format(), getNifType(), computeControlCharacter(), describeCifOrganisation(), 1. bertsioko konstanteak eta motak. Ingelesezko mezuak barne ditu.",
      locale: (language) =>
        `Hizkuntza-objektua (${language}), validate() eta describeCifOrganisation() funtzioei eta eskemei locale gisa pasatzeko.`,
      generate:
        "Zenbaki baliozko eta baliogabeen sorgailu hazidunak, probetarako. Sarrera-puntu nagusiak ez ditu inoiz inportatzen.",
      schemas: (library) =>
        `${library} eskemak mota guztietarako eta IFZ-BEZerako. ${library.split(" ")[0]} aukerako peer mendekotasun bat da.`,
      languages: {
        en: "ingelesa",
        es: "gaztelania",
        ca: "katalana (valentzierarako ere bai)",
        eu: "euskara",
        gl: "galegoa",
      },
    },
    apiFallback: {
      title: (module) => `${module}: APIaren erreferentzia`,
      description: (module) =>
        `${module} sarrera-puntuaren APIaren erreferentzia (ingelesez): sinadurak, aukerak eta probatutako adibideak.`,
    },
    bench: {
      run: {
        caption: "Non eta nola exekutatu zen errendimendu-proba",
        machine: "Makina",
        cores: "Nukleoak",
        memory: "Memoria",
        os: "Sistema eragilea",
        node: "Node.js",
        date: "Data",
        commit: "Neurtutako commita",
        method: "Metodoa",
        methodValue: (rounds, time, warmup) =>
          `${rounds} txanda; zeregin bakoitza ${time} ms, ${warmup} ms-ko berotzearen ondoren, bere prozesuan; zenbakia txanda medianarena da`,
      },
      throughput: {
        caption: (set, inputs) =>
          `${{ DNI: "NAN", NIE: "AIZ", CIF: "IFK" }[set] ?? set}: segundoko egiaztapen kopurua, milioitan (M ops/s; zenbat eta gehiago, orduan eta azkarragoa), forma kanonikoko ${inputs} dokumentu baliozko eta baliogaberekin, eta konpilazio honen errendimenduaren eta liburutegi bakoitzarenaren arteko proportzioa`,
        ops: "M ops/s",
        speedup: "Errendimendu erlatiboa",
        times: (value) => `errendimenduaren ${value} halakoa`,
        noneFaster: (set) =>
          `Beste liburutegi bat ere ez zen azkarragoa izan ${{ DNI: "NAN", NIE: "AIZ", CIF: "IFK" }[set] ?? set} multzoan.`,
        faster: (set, libraries) =>
          `Konpilazio hau baino azkarragoak ${{ DNI: "NAN", NIE: "AIZ", CIF: "IFK" }[set] ?? set} multzoan: ${libraries}.`,
      },
      size: {
        chartCaption:
          "Edozein motatako egiaztatzaile baten tamaina (min+gzip; zenbat eta gutxiago, orduan eta txikiagoa)",
        tableCaption:
          "Mota bakoitzeko egiaztatzaile baten eta liburutegi osoaren tamaina (min+gzip; zenbat eta gutxiago, orduan eta txikiagoa)",
        columns: {
          DNI: "NAN",
          NIE: "AIZ",
          CIF: "IFK",
          any: "Edozein mota",
          full: "Liburutegi osoa",
        },
        smaller: (libraries) =>
          `Konpilazio hau baino txikiagoak edozein motatako egiaztatzaile baterako: ${libraries}.`,
        noneSmaller:
          "Beste liburutegi bat ere ez da txikiagoa edozein motatako egiaztatzaile baterako.",
        alternative: (library, bytes) =>
          `Hau ere neurtu da: ${library}, Espainiako IFZaren modulua zuzenean inportatuta (dokumentatu gabea), ${bytes}.`,
      },
      agreement: {
        chartCaption:
          "SPEC.md fitxategiarekiko adostasuna (ez zuzentasun absolutua): liburutegi bakoitzak SPEC.md fitxategiak bezala epaitzen dituen kasuen ehunekoa, kasu guztietan eta sarrera kanonikoan bakarrik",
        tableCaption:
          "SPEC.md fitxategiarekiko adostasuna dokumentu motaren arabera, eta SPEC.md fitxategiak dokumentatzen dituen erabakiek eragindako desadostasunak",
        all: "Kasu guztiak",
        canonical: "Sarrera kanonikoa bakarrik",
        buckets: { DNI: "NAN", NIE: "AIZ", CIF: "IFK", KLM: "K/L/M" },
        disagreements: "Desadostasunak",
        documented: "Erabaki dokumentatu baten ondorioz",
      },
    },
    features: {
      caption:
        "npm-ko Espainiako identifikatzaileen liburutegien ezaugarriak, errenkada bakoitza berrikusteko erabilitako iturriekin",
      checkedOn: (date) =>
        `Berrikuste-data: ${date}, liburutegi bakoitzaren README-arekin, package.json fitxategiarekin eta npm orriarekin. Bertsioak eta tamainak errendimendu-proben emaitzetatik datoz.`,
      columns: {
        types: "Motak",
        klm: "K/L/M",
        normalizes: "Sarrera normalizatzen du",
        result: "Emaitza-objektua",
        messages: "Mezu itzuliak",
        generators: "Proba-datuen sorgailuak",
        schemas: "Eskemak",
        modules: "Moduluak",
        size: "Tamaina, edozein mota (min+gzip)",
        released: "Azken bertsioa",
        sources: "Iturriak",
      },
      phrases: {
        yes: "bai",
        no: "ez",
        partial: "partziala",
        optIn: "aukerakoa",
        separateNormalize: "normalize() bereizia",
        resultCodeRuleMessage: "bai: kodea, SPEC araua, mezua",
        resultTypeOnly: "ez (mota bakarrik)",
        resultErrorClass: "bai: errore-klasea",
        resultParseWithoutReason: "partziala: parse(), arrazoirik gabe",
        resultValidityCountry: "bai: baliozkotasuna eta herrialdea",
        englishOnly: "ingelesa bakarrik",
        typesStdnum: "NAN, AIZ, IFK, K/L/M eta 90 herrialde inguru",
        typesJsvat: "EBko IFZ-BEZak (ES + IFZ)",
        cjsUmdOnly: "CJS / UMD bakarrik",
        cjsOnly: "CJS bakarrik",
        esmDeepImportsCjs: "ESM (barne-bideak) + CJS",
        thisRelease: "bertsio hau",
        deprecatedOn: "{date}, zaharkitua",
      },
      readme: "README",
      npm: "npm",
    },
    jsonLd: {
      docsName: "nif-dni-nie-cif-validation liburutegiaren dokumentazioa",
    },
  },
};
