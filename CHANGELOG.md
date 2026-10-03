# [2.1.0](https://github.com/josegoval/nif-dni-nie-cif-validation/compare/v2.0.0...v2.1.0) (2026-10-03)


### Features

* **cli:** add a command line interface, npx nif-dni-nie-cif-validation ([544e095](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/544e0957a5c0a7b30c8b4237cf450c38d189f279)), closes [#61](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/61)

# [2.0.0](https://github.com/josegoval/nif-dni-nie-cif-validation/compare/v1.0.12...v2.0.0) (2026-10-02)


* build!: add an exports map and mark the package side-effect free ([3c6193e](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/3c6193e7924281501a8ebf9b7bbf517c2365e41e)), closes [#48](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/48)
* feat!: follow CIF-3 for the control of keys C D F G J U V ([b6a919c](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/b6a919cf492469845c422ce53a38d5a29787e7f8)), closes [#38](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/38) [#38](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/38) [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* feat!: normalize the input of the boolean validators by default ([66bc3d5](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/66bc3d53e49719a547ee04c1fc4fac151cbfce3b)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56) [#40](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/40)


### Bug Fixes

* **docs:** strip HTML comments completely when building llms-full.txt ([bb0c227](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/bb0c2274f2a76f7b9c291352c668eda43146f345))
* **locales:** apply the English confirmation review ([3eed1ba](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/3eed1baaebb4ed6dbfe7a15652f1a551c06943db))
* **locales:** apply the native-language review ([bfde7dc](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/bfde7dc30e0ee11c342bb12dd1bdb249e19c8587)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* **website:** apply the language confirmation review ([bfa332c](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/bfa332cdb980ab7cf0ef6b2f23e8b7e1db5965f0))
* **website:** apply the language confirmation review of the docs ([3a89f65](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/3a89f658707feafdf8f1e1be4933bfb2112cf05c))
* **website:** apply the language review ([c03f15f](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/c03f15fd3d2bb455f9de74052d53c957403b8b73))
* **website:** apply the language review of the documentation ([9d9d459](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/9d9d459a61a42bde662dd9c5c2767f0635d5e8c7))
* **website:** correct technical claims in the guides ([c3b789c](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/c3b789c0847d79a085329a536b86d75445a5dde0))


### Features

* add format() and computeControlCharacter() ([65dc86e](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/65dc86e428e18d0d3613414ed0e3525422c11335)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* add the Basque locale ([8fb3977](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/8fb3977c2377c0da902c034a18344f40af74db1a)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* add the Catalan locale (also for Valencian) ([869d2a5](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/869d2a524c77138d9de5301e1f240abfbc87fe48)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* add the Galician locale ([6d85afe](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/6d85afe7c890476ccd3f0a47e3c4e5717571a9b6)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* add the opt-in rejectPlaceholders option ([1e2459e](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/1e2459e0e6e770f00ce8e0b70d2d78ecc81af9aa)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56) [#41](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/41)
* add validate() and getNifType() with error codes and messages ([3533c53](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/3533c53ea0203f310c258dc97bf501752ef997ea)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56) [#36](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/36) [#40](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/40)
* describe the CIF organisation key ([6dd8710](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/6dd87107f16a7cab33039524e559ef50cf568ad9)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* **generate:** add seeded test-data generators for DNI, K/L/M, NIE and CIF ([f98d5ad](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/f98d5ad164d37973021412afbfce242415a8463d))
* select the language with a tree-shakable locale object ([81d388c](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/81d388c2a2800a8caa57e9f690f2976873b5077c)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56)
* support Spanish VAT numbers (ES + NIF) ([bab722e](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/bab722e5b6a4cb3ad9e4e180de858430d4af89fa)), closes [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56) [#36](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/36)
* type the boolean validators' input as unknown ([fa77037](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/fa77037980652899c8554f8d3f9cc0707f362d77)), closes [#40](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/40)
* **valibot:** add Valibot schemas vNif, vDni, vNie, vCif and vSpanishVat ([1c1ace4](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/1c1ace44d6c4529cbab4b2438b098fabf0906c80))
* **website:** add edit links and last-updated dates to the pages ([1704222](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/1704222786ce3008f9d616713078f34b005676d6)), closes [#65](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/65)
* **website:** add the landing page with the live validator ([1b11865](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/1b11865ac305d5dc05499ef92b90bad45d2acfa8)), closes [#64](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/64)
* **website:** add the Starlight site in five languages with the brand ([a25e1b5](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/a25e1b5570568ca543e5996dceed493458f16d36)), closes [#62](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/62)
* **website:** add the texts of the documentation components in five languages ([21e4a9a](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/21e4a9a4c0e3a57bef6515d64037f9ae4b350318))
* **website:** add Valibot and Yup tabs to the code examples ([d24c755](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/d24c755d2ca4f880c360702a7bc39b0bc0dae9bf))
* **website:** build the benchmarks and comparison pages from the data ([bfb5039](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/bfb50399333696ae6d8eec8ee0c6988a94d9f5d2)), closes [#66](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/66)
* **website:** choose npm, yarn, pnpm or bun in the hero install command ([df4ffb2](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/df4ffb265de4e0ff28aac890869ce72db8e7778c))
* **website:** describe the guides and the FAQ with JSON-LD ([34c2da8](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/34c2da80170a6b8c9ea6092617626d883872b1ec))
* **website:** generate the API reference from the JSDoc ([936091b](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/936091b848850fc0f84e7bd54d6d692ea0725deb)), closes [#65](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/65)
* **website:** publish the coverage report and badge at /coverage/ ([cec6150](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/cec615089e01bf5995abb5d15f809dd8fc04fd14)), closes [#63](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/63)
* **website:** render SPEC.md as the official sources page ([a444748](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/a4447486998bec9dfd4eb49d177887ed2d54efcf)), closes [#36](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/36) [#cif-3](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/cif-3)
* **yup:** add Yup schemas yNif, yDni, yNie, yCif and ySpanishVat ([9a09aee](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/9a09aee21f678d5465bfcbb122e4470f3f5ae988))
* **zod:** add Zod 4 schemas zNif, zDni, zNie, zCif and zSpanishVat ([fb815ba](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/fb815bab46b4fef02b160fb8cebe7550c63eaf35))


### Performance Improvements

* check isValidSpanishVat with isValidNif, not validate() ([a856970](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/a8569701d95ef34750acaa976d8d955e565e524f))
* find separators without a lookup table ([eac17e3](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/eac17e3885998147fa6237d7f2c5e0376a96cc4d))
* keep normalize() out of the boolean validators ([2ee4792](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/2ee479233c96cb3a095846df652df202b216e13f))
* keep the boolean validators' fast path on canonical input ([a2b404b](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/a2b404b94b52b7788f84171dba9bc72194343854)), closes [#76](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/76) [#56](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/56) [#47](https://github.com/josegoval/nif-dni-nie-cif-validation/issues/47)
* look up the CIF organisation key kinds in a string ([88e6cfe](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/88e6cfe1dddea7634abda63bcb4d48f82d4b1bef))
* reject by the first character before scanning in the NIE and CIF slow paths ([f00f2a5](https://github.com/josegoval/nif-dni-nie-cif-validation/commit/f00f2a5f092299bd69078131d97ec536c6dabbb5))


### BREAKING CHANGES

* only the documented entry points can be imported: the
package itself (`nif-dni-nie-cif-validation`) and
`nif-dni-nie-cif-validation/package.json`. Importing or requiring any other
path, such as `nif-dni-nie-cif-validation/dist/index` or
`nif-dni-nie-cif-validation/dist/nif/nif`, now fails with
ERR_PACKAGE_PATH_NOT_EXPORTED (or "Cannot find module" in TypeScript).
Import from the package root instead: it exports everything. The layout of
dist/ also changed (dist/esm and dist/cjs), as it is no longer public.
* the boolean validators (isValidNif,
isValidNaturalPersonNif, isValidDni, isValidNie, isValidCif /
isValidLegalEntityNif, isValidDniLetter, isValidCifControlCode /
isValidLegalEntityNifControlCode) now normalize their input, so values
with spaces, dots, hyphens or slashes, or a DNI without its leading
zeros, can now be valid (for example isValidNif(" 12.345.678-Z ") is
true). isValidCifControlCode no longer reads a space in a digit
position as 0. Pass `{ normalize: false }` as the second argument to
keep the v1 parsing. In TypeScript, a validator passed straight to an
array method (`ids.filter(isValidNif)`) no longer type-checks, because
the index is not an options object; write `ids.filter((id) =>
isValidNif(id))`.
* a legal entity NIF (CIF) with key C, D, F, G, J, U or V
and a letter control (for example G1234567D) is now invalid in isValidNif,
isValidCif / isValidLegalEntityNif and isValidCifControlCode /
isValidLegalEntityNifControlCode. isValidCifControlCode also returns
false when the first character is not an organisation key. To keep the
v1 behaviour, pass `{ cifControl: "lenient" }` as the second argument,
for example `isValidCif(value, { cifControl: "lenient" })`.

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
