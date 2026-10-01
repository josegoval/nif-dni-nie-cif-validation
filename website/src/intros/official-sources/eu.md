---
title: Iturri ofizialak
description: nif-dni-nie-cif-validation liburutegiak Espainiako IFZ, NAN, K/L/M IFZ, AIZ eta IFK zenbakiei aplikatzen dizkien arau guztiak, bakoitzaren identifikatzailea, iturri-maila (legea, irizpide ofiziala edo konbentzioa) eta oinarri duen aipua barne.
---

Orri hau [SPEC.md](https://github.com/josegoval/nif-dni-nie-cif-validation/blob/master/SPEC.md) da, liburutegiak zer onartzen eta zer baztertzen duen zehazten duen espezifikazioa, gunea eraikitzen den bakoitzean fitxategitik sortua. `validate()` funtzioak itzultzen duen errore bakoitzak beheko arau-identifikatzaileetako bat adierazten du (`DNI-2`, `CIF-3`…), eta arau bakoitzak aingura bat du, [#cif-3](#cif-3) adibidez, estekatu dezakezuna.

Interneten aurkituko dituzun arau guztiek ez dute iturri ofizialik; beraz, arau bakoitzak maila bat du:

- **Legea (T1)**: indarrean dagoen lege-testu bat, BOEn (Estatuko Aldizkari Ofizialean) argitaratua; adibidez, NAN, AIZ, K/L/M IFZ eta IFK formatuak eta IFKaren erakunde-gakoak.
- **Irizpide ofiziala (T2)**: dokumentuaren arduradun den administrazioaren orri bat, Barne Ministerioarena edo AEATrena (Zerga Agentziarena). NANaren kontrol-letra (23 modulua) han argitaratzen da, baita AEATren ohar teknikoan ere (T3), baina ez inongo legetan.
- **Erdi-ofiziala (T3)**: AEATren IFZari buruzko barneko ohar teknikoa. Zein IFK gakok daraman digitu bat eta zeinek letra bat adierazten duen iturri bakarra da.
- **Konbentzioa (T4)**: testu ofizialik gabeko sektoreko praktika bat, hala identifikatua. Konbentzioek sarreraren garbiketari bakarrik eragiten diote (minuskulak, bereizleak), inoiz ez zein dokumentu diren baliozkoak, salbuespen dokumentatu batekin: testu ofizial batek ere ez du argitaratzen IFKaren kontrolaren aritmetika ([CIF-4](#cif-4)).

Espezifikazioa ingelesez idatzita dago, eta jarraian dagoen bezala erakusten da. Aldaketa bat proposatzeko, ikusi [How to propose a change](#how-to-propose-a-change).
