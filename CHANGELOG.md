## [1.0.12](https://github.com/josegoval/nif-dni-nie-cif-validation/compare/v1.0.11...v1.0.12) (2026-09-30)


### Performance Improvements

* pick the NIF format from the first character ([afd5db9](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/afd5db9fe477a7c40570a097ce9bac27ab7cf28a)), closes [#47](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/47)
* validate DNI, K/L/M and NIE in one pass without allocations ([035bd17](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/035bd177e566447b6a024e7d91a34091ace21403)), closes [#47](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/47)
* validate legal entity NIFs (CIF) in one pass without allocations ([c2156f4](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/c2156f404e0b053735f37db1d3e9b454bdeef186)), closes [#38](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/38) [#47](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/47) [#51](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/51)

## [1.0.11](https://github.com/josegoval/nif-dni-nie-cif-validation/compare/v1.0.10...v1.0.11) (2026-09-30)


### Bug Fixes

* **cif:** drop the dead "00" branch and accept lower-case control letters ([2bf68cb](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/2bf68cbe6c6c69cd6b79f19461d08c07b421919e)), closes [#33](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/33)
* **cif:** require a letter control for organisation key N ([7fb5180](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/7fb518095abd6c57337ae840f2e3dc8e62313d68)), closes [#38](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/38)
* guarantee the isValid* functions never throw on any input ([d1f6b86](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/d1f6b863ccf6349157ce34b83819c7a53d7b9761)), closes [#40](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/40)
* **nie:** accept old 10-character NIEs (X + 0 + 7 digits + letter) ([6ff9065](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/6ff906511164e729d8a1f0fbf489678d1d143e03)), closes [#39](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/39)
* **nif:** accept lower-case DNI, K/L/M and NIE control letters ([f47c35f](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/f47c35f447c0df4b7b4cd00c81c6b99e5b7678b6)), closes [#37](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/37)

## [1.0.10](https://github.com/josegoval/nif-dni-nie-cif-validation/compare/v1.0.9...v1.0.10) (2023-01-10)


### Bug Fixes

* copyright comment removed ([e480471](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/e4804716c8308c723f87f8e5f98163c955585d6f))
