# Changelog

## [15.0.2](https://github.com/npm/make-fetch-happen/compare/v15.0.1...v15.0.2) (2025-09-18)
### Dependencies
* [`dfced01`](https://github.com/npm/make-fetch-happen/commit/dfced01a3b33a970891fe05f238c8597e2486dcb) [#335](https://github.com/npm/make-fetch-happen/pull/335) `@npmcli/agent@4.0.0`

## [15.0.1](https://github.com/npm/make-fetch-happen/compare/v15.0.0...v15.0.1) (2025-08-19)
### Dependencies
* [`852a0d3`](https://github.com/npm/make-fetch-happen/commit/852a0d38eb70ac1241dd3fad96dd33c4a9f2a7a6) [#333](https://github.com/npm/make-fetch-happen/pull/333) `cacache@20.0.1`

## [15.0.0](https://github.com/npm/make-fetch-happen/compare/v14.0.3...v15.0.0) (2025-07-24)
### ⚠️ BREAKING CHANGES
* `make-fetch-happen` now supports node `^20.17.0 || >=22.9.0`
### Bug Fixes
* [`070a458`](https://github.com/npm/make-fetch-happen/commit/070a45860e94ccf3104c31cee37cf56df3a23dec) [#331](https://github.com/npm/make-fetch-happen/pull/331) align to npm 11 node engine range (@owlstronaut)
### Dependencies
* [`2eb291c`](https://github.com/npm/make-fetch-happen/commit/2eb291c659738f13a2ba92f538584ccc8fdced6f) [#331](https://github.com/npm/make-fetch-happen/pull/331) `cacache@20.0.0`
* [`0ff7492`](https://github.com/npm/make-fetch-happen/commit/0ff7492000ad07e217c5676f9afb464c326d7aa8) [#331](https://github.com/npm/make-fetch-happen/pull/331) `@npmcli/template-oss@4.25.0`
### Chores
* [`525c84c`](https://github.com/npm/make-fetch-happen/commit/525c84cced73fb29780b5fa421b9bad364feedb0) [#331](https://github.com/npm/make-fetch-happen/pull/331) template-oss apply fix (@owlstronaut)
* [`a00560d`](https://github.com/npm/make-fetch-happen/commit/a00560da0ddc4747816ea668b6168a91ab10ca3e) [#330](https://github.com/npm/make-fetch-happen/pull/330) bump @npmcli/template-oss from 4.23.4 to 4.24.3 (#330) (@owlstronaut)

## [14.0.3](https://github.com/npm/make-fetch-happen/compare/v14.0.2...v14.0.3) (2024-10-21)
### Bug Fixes
* [`3e0fe87`](https://github.com/npm/make-fetch-happen/commit/3e0fe87763e4c954ec6f39e1b5f44eac0e68f15f) [#316](https://github.com/npm/make-fetch-happen/pull/316) stop ignoring NODE_TLS_REJECT_UNAUTHORIZED when strictSSL is not defined (#316) (@brunoargolo, Bruno Oliveira)
### Dependencies
* [`05fbcc3`](https://github.com/npm/make-fetch-happen/commit/05fbcc3d2cf0b29461edec96ef3fde73f4cf24c4) [#327](https://github.com/npm/make-fetch-happen/pull/327) bump negotiator from 0.6.4 to 1.0.0 (#327) (@dependabot[bot])

## [14.0.2](https://github.com/npm/make-fetch-happen/compare/v14.0.1...v14.0.2) (2024-10-16)
### Bug Fixes
* [`fa5f233`](https://github.com/npm/make-fetch-happen/commit/fa5f233e99458478fa5b18e77d953996e0b7a078) [#324](https://github.com/npm/make-fetch-happen/pull/324) don't use the request signal in the agent (#324) (@thewilkybarkid, @wraithgar)
### Chores
* [`b3742c5`](https://github.com/npm/make-fetch-happen/commit/b3742c551a74382d34f0ed9f2cd5bcd3fc900f08) [#323](https://github.com/npm/make-fetch-happen/pull/323) bump @npmcli/template-oss from 4.23.3 to 4.23.4 (#323) (@dependabot[bot], @npm-cli-bot)

## [14.0.1](https://github.com/npm/make-fetch-happen/compare/v14.0.0...v14.0.1) (2024-10-02)
### Dependencies
* [`5eae0b6`](https://github.com/npm/make-fetch-happen/commit/5eae0b6331b8e893add029ae443fe0330e3f30ff) [#321](https://github.com/npm/make-fetch-happen/pull/321) bump `cacache@19.0.1`

## [14.0.0](https://github.com/npm/make-fetch-happen/compare/v13.0.1...v14.0.0) (2024-09-26)
### ⚠️ BREAKING CHANGES
* `make-fetch-happen` now supports node `^18.17.0 || >=20.5.0`
### Bug Fixes
* [`a1beba7`](https://github.com/npm/make-fetch-happen/commit/a1beba7f775f27349203078790e53d103a365d61) [#318](https://github.com/npm/make-fetch-happen/pull/318) align to npm 10 node engine range (@reggi)
### Dependencies
* [`aa5d07a`](https://github.com/npm/make-fetch-happen/commit/aa5d07a27a82d3cef9839f07bd957a21ba6dcdd2) [#318](https://github.com/npm/make-fetch-happen/pull/318) `ssri@12.0.0`
* [`0113d1f`](https://github.com/npm/make-fetch-happen/commit/0113d1f1908fb4bf3acba9ac3264561f0870e52a) [#318](https://github.com/npm/make-fetch-happen/pull/318) `proc-log@5.0.0`
* [`f0db136`](https://github.com/npm/make-fetch-happen/commit/f0db136979225cd72e36f45bed41dc261780d105) [#318](https://github.com/npm/make-fetch-happen/pull/318) `minipass-fetch@4.0.0`
* [`be3558d`](https://github.com/npm/make-fetch-happen/commit/be3558d0033d918e2bf48dde80e8b7a94d467531) [#318](https://github.com/npm/make-fetch-happen/pull/318) `@npmcli/agent@3.0.0`
* [`d255fcb`](https://github.com/npm/make-fetch-happen/commit/d255fcbaac5b04bccbb7b1c697162b4d9b3334c7) [#299](https://github.com/npm/make-fetch-happen/pull/299) remove is-lambda dependency (#299)
### Chores
* [`30ee575`](https://github.com/npm/make-fetch-happen/commit/30ee575a9330f25d41cfd4c4bf9cb44d1395117a) [#318](https://github.com/npm/make-fetch-happen/pull/318) run template-oss-apply (@reggi)
* [`253f3b9`](https://github.com/npm/make-fetch-happen/commit/253f3b9be576a80df96e60fe99e92cf6c1596e22) [#309](https://github.com/npm/make-fetch-happen/pull/309) bump @npmcli/eslint-config from 4.0.5 to 5.0.0 (@dependabot[bot])
* [`58dc7ef`](https://github.com/npm/make-fetch-happen/commit/58dc7ef5e468d38798afca61f0e1ab1652ba6447) [#295](https://github.com/npm/make-fetch-happen/pull/295) bump @npmcli/template-oss to 4.22.0 (@lukekarrys)
* [`f51f1de`](https://github.com/npm/make-fetch-happen/commit/f51f1dee37486eedaad4ce471a3aa1a83cec6335) [#311](https://github.com/npm/make-fetch-happen/pull/311) postinstall for dependabot template-oss PR (@hashtagchris)
* [`381750e`](https://github.com/npm/make-fetch-happen/commit/381750edf8e35ef3669269142cedcd6e5ef2b3be) [#311](https://github.com/npm/make-fetch-happen/pull/311) bump @npmcli/template-oss from 4.23.1 to 4.23.3 (@dependabot[bot])

## [13.0.1](https://github.com/npm/make-fetch-happen/compare/v13.0.0...v13.0.1) (2024-04-30)

### Bug Fixes

* [`66018e3`](https://github.com/npm/make-fetch-happen/commit/66018e300fe39f3d3485d444a0c1fd80984c5d7d) log errors on retry (@wraithgar)
* [`ed73ef5`](https://github.com/npm/make-fetch-happen/commit/ed73ef528397a574df711e24238aaf7954512e55) [#288](https://github.com/npm/make-fetch-happen/pull/288) always catch and emit cache write errors in promise (#288) (@lukekarrys)

### Chores

* [`9e1329c`](https://github.com/npm/make-fetch-happen/commit/9e1329c8c8a81495d58dc0da7d233142008c7d98) [#292](https://github.com/npm/make-fetch-happen/pull/292) fix linting in tests (@lukekarrys)
* [`4756bda`](https://github.com/npm/make-fetch-happen/commit/4756bda3e4d40e449b99b2d964fc59bebda76941) [#292](https://github.com/npm/make-fetch-happen/pull/292) postinstall for dependabot template-oss PR (@lukekarrys)
* [`91df666`](https://github.com/npm/make-fetch-happen/commit/91df666381e17c750dc4b0c6b33bf25c6b39aa7a) [#292](https://github.com/npm/make-fetch-happen/pull/292) bump @npmcli/template-oss from 4.21.3 to 4.21.4 (@dependabot[bot])

## [13.0.0](https://github.com/npm/make-fetch-happen/compare/v12.0.0...v13.0.0) (2023-08-15)

### ⚠️ BREAKING CHANGES

* support for node <=16.13 has been removed

### Bug Fixes

* [`fb1c716`](https://github.com/npm/make-fetch-happen/commit/fb1c716ccca310d2cf989be3b89e924bce369bab) [#262](https://github.com/npm/make-fetch-happen/pull/262) drop node 16.13.x support (@lukekarrys)

### Dependencies

* [`41295dc`](https://github.com/npm/make-fetch-happen/commit/41295dcb76b0bc5e0a953b2f64dd8b7cd63e0c29) [#264](https://github.com/npm/make-fetch-happen/pull/264) bump @npmcli/agent from 1.1.0 to 2.0.0
* [`4875556`](https://github.com/npm/make-fetch-happen/commit/4875556e51814bc84971240ae58a0cddc740db2b) [#261](https://github.com/npm/make-fetch-happen/pull/261) bump cacache from 17.1.4 to 18.0.0

## [12.0.0](https://github.com/npm/make-fetch-happen/compare/v11.1.1...v12.0.0) (2023-07-27)

### ⚠️ BREAKING CHANGES

* support for node 14 has been removed
* this changes the underlying http agents to those provided by `@npmcli/agent`.  Backwards compatibility should be fully implemented but due to the scope of this change it was made a breaking change out of an abundance of caution.

### Features

* [`7c25367`](https://github.com/npm/make-fetch-happen/commit/7c25367d95c5a0853b4b1e93c13456ac1cfc493d) [#255](https://github.com/npm/make-fetch-happen/pull/255) move to @npmcli/agent (@wraithgar)

### Bug Fixes

* [`3059b28`](https://github.com/npm/make-fetch-happen/commit/3059b286be9884f0d2f83f5b57314e924c07c57d) [#259](https://github.com/npm/make-fetch-happen/pull/259) drop node14 support (#259) (@wraithgar)

### Documentation

* [`efd1e2f`](https://github.com/npm/make-fetch-happen/commit/efd1e2f02a38e7f39fe291503546f1be92ad0fa7) [#255](https://github.com/npm/make-fetch-happen/pull/255) update readme (@wraithgar)

### Dependencies

* [`5318d23`](https://github.com/npm/make-fetch-happen/commit/5318d239280b951479877badd81868411d71f19f) [#253](https://github.com/npm/make-fetch-happen/pull/253) bump minipass from 5.0.0 to 7.0.2 (#253)
* [`5493550`](https://github.com/npm/make-fetch-happen/commit/5493550d841cc2b182deae6717c010d9fb445002) [#255](https://github.com/npm/make-fetch-happen/pull/255) remove lru-cache
* [`193b901`](https://github.com/npm/make-fetch-happen/commit/193b901f69adb8497f932beaeb60bff1fe0a94b5) [#255](https://github.com/npm/make-fetch-happen/pull/255) remove socks-proxy-agent
* [`fc35622`](https://github.com/npm/make-fetch-happen/commit/fc356228b1127e65f3c5c27f4e2b1dc26167298a) [#255](https://github.com/npm/make-fetch-happen/pull/255) remove agentkeepalive
* [`e78fcdf`](https://github.com/npm/make-fetch-happen/commit/e78fcdf507938806dffcd4ce82c0f9373e589b29) [#255](https://github.com/npm/make-fetch-happen/pull/255) remove https-proxy-agent
* [`a4089a0`](https://github.com/npm/make-fetch-happen/commit/a4089a0946476d5ea2624130d0fcf6da5b99d730) [#255](https://github.com/npm/make-fetch-happen/pull/255) remove http-proxy-agent
* [`92c3226`](https://github.com/npm/make-fetch-happen/commit/92c32269646e531e86a0b1b7efe96596506ef563) [#255](https://github.com/npm/make-fetch-happen/pull/255) add @npmcli/agent

## [11.1.1](https://github.com/npm/make-fetch-happen/compare/v11.1.0...v11.1.1) (2023-04-27)

### Dependencies

* [`b04e3c2`](https://github.com/npm/make-fetch-happen/commit/b04e3c279e8dc6b090f3e2bfbd854fd0af3e9195) [#220](https://github.com/npm/make-fetch-happen/pull/220) bump minipass from 4.2.7 to 5.0.0 (#220)

## [11.1.0](https://github.com/npm/make-fetch-happen/compare/v11.0.3...v11.1.0) (2023-04-13)

### Features

* [`cca9da0`](https://github.com/npm/make-fetch-happen/commit/cca9da0af76b5900a9c480967769df91bca2570d) [#225](https://github.com/npm/make-fetch-happen/pull/225) add support for caching additional headers (#225) (@nlf)

## [11.0.3](https://github.com/npm/make-fetch-happen/compare/v11.0.2...v11.0.3) (2023-02-02)

### Dependencies

* [`fb01043`](https://github.com/npm/make-fetch-happen/commit/fb0104335a2101e4f21721457e80b59a8300017e) [#212](https://github.com/npm/make-fetch-happen/pull/212) remove unused dependencies (#212)
* [`5807162`](https://github.com/npm/make-fetch-happen/commit/58071621daa6d7e1cb28a61fc06df531baf440f3) [#210](https://github.com/npm/make-fetch-happen/pull/210) `http-cache-semantics@4.1.1` (#210)

## [11.0.2](https://github.com/npm/make-fetch-happen/compare/v11.0.1...v11.0.2) (2022-12-07)

### Dependencies

* [`77018ff`](https://github.com/npm/make-fetch-happen/commit/77018ff5c7ceeeda92e7d62435c4a6214e966a99) [#194](https://github.com/npm/make-fetch-happen/pull/194) bump minipass from 3.3.6 to 4.0.0

## [11.0.1](https://github.com/npm/make-fetch-happen/compare/v11.0.0...v11.0.1) (2022-10-17)

### Dependencies

* [`ebd86b2`](https://github.com/npm/make-fetch-happen/commit/ebd86b27813fde64cdeb1997857735dba7a25f85) [#186](https://github.com/npm/make-fetch-happen/pull/186) bump minipass-fetch from 2.1.2 to 3.0.0
* [`9c16d84`](https://github.com/npm/make-fetch-happen/commit/9c16d84c10dddada3a1d0aeb74ad7b77220dd7eb) [#187](https://github.com/npm/make-fetch-happen/pull/187) bump ssri from 9.0.1 to 10.0.0

## [11.0.0](https://github.com/npm/make-fetch-happen/compare/v10.2.1...v11.0.0) (2022-10-13)

### ⚠️ BREAKING CHANGES

* this module no longer attempts to change file ownership automatically
* `make-fetch-happen` is now compatible with the following semver range for node: `^14.17.0 || ^16.13.0 || >=18.0.0`

### Features

* [`c293053`](https://github.com/npm/make-fetch-happen/commit/c2930534bcf65907c4968ba5600d41910862fba5) [#177](https://github.com/npm/make-fetch-happen/pull/177) postinstall for dependabot template-oss PR (@lukekarrys)

### Documentation

* [`d63de44`](https://github.com/npm/make-fetch-happen/commit/d63de4427ecadcc1c5a688564df8449ca182aafd) [#173](https://github.com/npm/make-fetch-happen/pull/173) document cause argument to onRetry (#173) (@jmpage)

### Dependencies

* [`33d972a`](https://github.com/npm/make-fetch-happen/commit/33d972a81517c6817b39dd9c8adf9bfa7cf78391) [#184](https://github.com/npm/make-fetch-happen/pull/184) bump cacache from 16.1.3 to 17.0.0 (#184)

## [10.2.1](https://github.com/npm/make-fetch-happen/compare/v10.2.0...v10.2.1) (2022-08-15)


### Bug Fixes

* linting ([#166](https://github.com/npm/make-fetch-happen/issues/166)) ([e9a2a51](https://github.com/npm/make-fetch-happen/commit/e9a2a51e6d72e75802a73fe3b2b0e84753cc202a))

## [10.2.0](https://github.com/npm/make-fetch-happen/compare/v10.1.8...v10.2.0) (2022-07-19)


### Features

* store link header ([#164](https://github.com/npm/make-fetch-happen/issues/164)) ([dae6384](https://github.com/npm/make-fetch-happen/commit/dae6384a7f20c541708804b08ce233d14d592613))

## [10.1.8](https://github.com/npm/make-fetch-happen/compare/v10.1.7...v10.1.8) (2022-06-20)


### Bug Fixes

* TypeError: SocksProxyAgent is not a constructor ([#161](https://github.com/npm/make-fetch-happen/issues/161)) ([4ae4864](https://github.com/npm/make-fetch-happen/commit/4ae48640b091f4f64ad4c52037c147b1dfd83f04))

### [10.1.7](https://github.com/npm/make-fetch-happen/compare/v10.1.6...v10.1.7) (2022-06-01)


### Bug Fixes

* use hostname for socks agent ([#159](https://github.com/npm/make-fetch-happen/issues/159)) ([331f9cb](https://github.com/npm/make-fetch-happen/commit/331f9cb273584da452994c6d9ce3e36df2bafb03))


### Dependencies

* bump socks-proxy-agent from 6.2.1 to 7.0.0 ([#158](https://github.com/npm/make-fetch-happen/issues/158)) ([63ed403](https://github.com/npm/make-fetch-happen/commit/63ed40395ea2c34313575b42e083a428b506fd88))

### [10.1.6](https://github.com/npm/make-fetch-happen/compare/v10.1.5...v10.1.6) (2022-05-27)


### Bug Fixes

* respect given algorithms instead of always using sha512 ([#156](https://github.com/npm/make-fetch-happen/issues/156)) ([9baa806](https://github.com/npm/make-fetch-happen/commit/9baa8065f32a89ebd49eb59258462c209a68f142))

### [10.1.5](https://github.com/npm/make-fetch-happen/compare/v10.1.4...v10.1.5) (2022-05-19)


### Bug Fixes

* cache integrity and size events so late listeners still get them ([#154](https://github.com/npm/make-fetch-happen/issues/154)) ([8c78584](https://github.com/npm/make-fetch-happen/commit/8c7858490aa5dc40e13d1c2580b5937836111a5b))

### [10.1.4](https://github.com/npm/make-fetch-happen/compare/v10.1.3...v10.1.4) (2022-05-18)


### Bug Fixes

* **docs:** remove reference to unsupported feature ([#153](https://github.com/npm/make-fetch-happen/issues/153)) ([1d454f1](https://github.com/npm/make-fetch-happen/commit/1d454f11877267e1f80a9cc42f8f249fe6ec887f)), closes [#147](https://github.com/npm/make-fetch-happen/issues/147)
* pass expected integrity to cacache ([a88213e](https://github.com/npm/make-fetch-happen/commit/a88213e6a5e3a74c746d326488e2e6e056a2df54))
* pass integrityEmitter to cacache to avoid a redundant integrity stream ([ae62c21](https://github.com/npm/make-fetch-happen/commit/ae62c21c70d2004bbaa967ae2b722890b4283cbb))
* remove in-memory buffering in favor of full time streaming ([ec2db21](https://github.com/npm/make-fetch-happen/commit/ec2db214e4d54a8ba81a4315b4b3f21e71181069))

### [10.1.3](https://github.com/npm/make-fetch-happen/compare/v10.1.2...v10.1.3) (2022-05-09)


### Bug Fixes

* make `defaults` chaining actually work ([#144](https://github.com/npm/make-fetch-happen/issues/144)) ([aa71e81](https://github.com/npm/make-fetch-happen/commit/aa71e817c71968f547f4d1756b1faf92db7b79ec))

### [10.1.2](https://github.com/npm/make-fetch-happen/compare/v10.1.1...v10.1.2) (2022-04-05)


### Dependencies

* bump ssri from 8.0.1 to 9.0.0 ([#139](https://github.com/npm/make-fetch-happen/issues/139)) ([f91a1cc](https://github.com/npm/make-fetch-happen/commit/f91a1ccd0ea2821a3686b4b8ffd3fad47c2aeabd))

### [10.1.1](https://github.com/npm/make-fetch-happen/compare/v10.1.0...v10.1.1) (2022-03-29)


### Bug Fixes

* default verbatim to undefined ([#135](https://github.com/npm/make-fetch-happen/issues/135)) ([be0cf6a](https://github.com/npm/make-fetch-happen/commit/be0cf6a15949c0511b40ed086aeab29fb86c2259))


### Documentation

* remove mention of custom cache provider ([#136](https://github.com/npm/make-fetch-happen/issues/136)) ([a7f1b55](https://github.com/npm/make-fetch-happen/commit/a7f1b554bc0072a1545d96f316e252ec52e81b23))

## [10.1.0](https://github.com/npm/make-fetch-happen/compare/v10.0.6...v10.1.0) (2022-03-24)


### Features

* implement local dns cache ([#132](https://github.com/npm/make-fetch-happen/issues/132)) ([25cae2e](https://github.com/npm/make-fetch-happen/commit/25cae2ec00c1b0549b40d3d076ed4beacea25ceb))


### Dependencies

* update cacache requirement from ^16.0.0 to ^16.0.1 ([#122](https://github.com/npm/make-fetch-happen/issues/122)) ([cb3873c](https://github.com/npm/make-fetch-happen/commit/cb3873cbe774e182d954c601af35c022783a5d5c))
* update cacache requirement from ^16.0.1 to ^16.0.2 ([#127](https://github.com/npm/make-fetch-happen/issues/127)) ([44fe6ce](https://github.com/npm/make-fetch-happen/commit/44fe6ce8c9326b181913564e4808fce7df6f589b))
* update lru-cache requirement from ^7.5.1 to ^7.7.1 ([#128](https://github.com/npm/make-fetch-happen/issues/128)) ([eb6e7b6](https://github.com/npm/make-fetch-happen/commit/eb6e7b657d0b9da6d1063d2ff3d9f08b3827c017))

### [10.0.6](https://www.github.com/npm/make-fetch-happen/compare/v10.0.5...v10.0.6) (2022-03-14)


### Dependencies

* bump cacache from 15.3.0 to 16.0.0 ([#121](https://www.github.com/npm/make-fetch-happen/issues/121)) ([de032e9](https://www.github.com/npm/make-fetch-happen/commit/de032e9018c459ee7acd76448ed198040beb3418))
* update lru-cache requirement from ^7.4.1 to ^7.4.2 ([#115](https://www.github.com/npm/make-fetch-happen/issues/115)) ([a3f4ba9](https://www.github.com/npm/make-fetch-happen/commit/a3f4ba975247f31a803be9afd95fc652e4043cc6))
* update lru-cache requirement from ^7.4.2 to ^7.4.4 ([#117](https://www.github.com/npm/make-fetch-happen/issues/117)) ([24a7ddd](https://www.github.com/npm/make-fetch-happen/commit/24a7ddd3a6970cc9b0d92807c9db002fcb53a913))
* update lru-cache requirement from ^7.4.4 to ^7.5.0 ([#119](https://www.github.com/npm/make-fetch-happen/issues/119)) ([5ef3bb3](https://www.github.com/npm/make-fetch-happen/commit/5ef3bb38b4fd122d5ffc012420e94a623a3d300d))
* update lru-cache requirement from ^7.5.0 to ^7.5.1 ([#120](https://www.github.com/npm/make-fetch-happen/issues/120)) ([8c5db07](https://www.github.com/npm/make-fetch-happen/commit/8c5db07f31f422de646026d7fb437bc4a6233473))
* update minipass-fetch requirement from ^2.0.2 to ^2.0.3 ([#114](https://www.github.com/npm/make-fetch-happen/issues/114)) ([bc71014](https://www.github.com/npm/make-fetch-happen/commit/bc71014c485a6963d8b6f5d8a3af793465bf9b39))

### [10.0.5](https://www.github.com/npm/make-fetch-happen/compare/v10.0.4...v10.0.5) (2022-03-07)


### Bug Fixes

* add code property to unsupported proxy url error ([#112](https://www.github.com/npm/make-fetch-happen/issues/112)) ([569a613](https://www.github.com/npm/make-fetch-happen/commit/569a6136b0ded34edd5de3584f518233fc720fcd))


### Dependencies

* update lru-cache requirement from ^7.4.0 to ^7.4.1 ([#113](https://www.github.com/npm/make-fetch-happen/issues/113)) ([b7f3e28](https://www.github.com/npm/make-fetch-happen/commit/b7f3e28f07c0e023dc6b616f61957fc49b3fdd2c))
* update minipass-fetch requirement from ^2.0.1 to ^2.0.2 ([#109](https://www.github.com/npm/make-fetch-happen/issues/109)) ([4a9892a](https://www.github.com/npm/make-fetch-happen/commit/4a9892a0fbf79965ed272d9bc5422c4525e7a990))

### [10.0.4](https://www.github.com/npm/make-fetch-happen/compare/v10.0.3...v10.0.4) (2022-03-02)


### Dependencies

* bump minipass-fetch from 1.4.1 to 2.0.1 ([#108](https://www.github.com/npm/make-fetch-happen/issues/108)) ([0257b63](https://www.github.com/npm/make-fetch-happen/commit/0257b637dde5831c9a9f1f652282d7818bebfa4a))
* update agentkeepalive requirement from ^4.2.0 to ^4.2.1 ([#102](https://www.github.com/npm/make-fetch-happen/issues/102)) ([0252efc](https://www.github.com/npm/make-fetch-happen/commit/0252efcb934c2b3d95af366d79b26d74aa477ca9))
* update lru-cache requirement from ^7.3.1 to ^7.4.0 ([#103](https://www.github.com/npm/make-fetch-happen/issues/103)) ([140ff64](https://www.github.com/npm/make-fetch-happen/commit/140ff64e90962ba5b8f7be7ef39446a669cfe572))

### [10.0.3](https://www.github.com/npm/make-fetch-happen/compare/v10.0.2...v10.0.3) (2022-02-15)


### Bug Fixes

* set agentkeepalive freeSocketTimeout back to 15 seconds ([#100](https://www.github.com/npm/make-fetch-happen/issues/100)) ([3371abf](https://www.github.com/npm/make-fetch-happen/commit/3371abf9e342d75bdc063b346bdefedd573f55a9))

### [10.0.2](https://www.github.com/npm/make-fetch-happen/compare/v10.0.1...v10.0.2) (2022-02-10)


### Dependencies

* update lru-cache requirement from ^7.3.0 to ^7.3.1 ([6ca02ad](https://www.github.com/npm/make-fetch-happen/commit/6ca02ad504a7eaf62e81cf170cd5e947ef79584d))

### [10.0.1](https://www.github.com/npm/make-fetch-happen/compare/v10.0.0...v10.0.1) (2022-02-09)


### Bug Fixes

* **agent:** don't use polynomial regex ([61856c6](https://www.github.com/npm/make-fetch-happen/commit/61856c65149f74ab353d8d6d401e90abb6f30950))


### Dependencies

* bump lru-cache from 6.0.0 to 7.0.1 ([3e353d2](https://www.github.com/npm/make-fetch-happen/commit/3e353d2bf7ce035346295eb5ffd5c2d169466537))
* update agentkeepalive requirement from ^4.1.3 to ^4.2.0 ([ed7f983](https://www.github.com/npm/make-fetch-happen/commit/ed7f98364f9a5b11c8fc5fd088c68d04df42415d))
* update cacache requirement from ^15.2.0 to ^15.3.0 ([46e0ac4](https://www.github.com/npm/make-fetch-happen/commit/46e0ac4f54a2cdf4ec925768238073ac941ed8d9))
* update lru-cache requirement from ^7.0.1 to ^7.3.0 ([e825c2c](https://www.github.com/npm/make-fetch-happen/commit/e825c2c26d41fe9076031c62827c5dc91898837e))
* update minipass requirement from ^3.1.3 to ^3.1.6 ([778c46a](https://www.github.com/npm/make-fetch-happen/commit/778c46a42e0e674d61bcce38cb248263c5a1149f))
* update minipass-fetch requirement from ^1.3.2 to ^1.4.1 ([6fabf4c](https://www.github.com/npm/make-fetch-happen/commit/6fabf4c23c8a33dce221ea2fac8cb1ecd14767a1))
* update socks-proxy-agent requirement from ^6.0.0 to ^6.1.1 ([58f3b29](https://www.github.com/npm/make-fetch-happen/commit/58f3b291eaec6bd6ce534de51ee8db9dd8348e4a))
* update ssri requirement from ^8.0.0 to ^8.0.1 ([5b75b08](https://www.github.com/npm/make-fetch-happen/commit/5b75b089a66c9c26564034d55dc0d04f5f59a515))

## [10.0.0](https://www.github.com/npm/make-fetch-happen/compare/v9.1.0...v10.0.0) (2022-01-25)


### ⚠ BREAKING CHANGES

* this drops support for node10 and non-LTS versions of node12 and node14

### Bug Fixes

* Add year to license ([#68](https://www.github.com/npm/make-fetch-happen/issues/68)) ([d0d86eb](https://www.github.com/npm/make-fetch-happen/commit/d0d86eb42fa16b7d5de51d77c69255efb437daf6))
* compress option and accept/content encoding header edge cases ([#65](https://www.github.com/npm/make-fetch-happen/issues/65)) ([f7d1255](https://www.github.com/npm/make-fetch-happen/commit/f7d1255951f936713a260efc85d4727f2b05eafe))
* move to template-oss ([105872f](https://www.github.com/npm/make-fetch-happen/commit/105872f6fede073c1423d8b7548afdfcad06b89a))
* revert negotiator preload hack ([8688f09](https://www.github.com/npm/make-fetch-happen/commit/8688f0952cb5710f6e802ae2858d6f00efc2d71d))
* strip cookie header on redirect across hostnames ([#71](https://www.github.com/npm/make-fetch-happen/issues/71)) ([ec53f27](https://www.github.com/npm/make-fetch-happen/commit/ec53f27335a8d1b981c7d32e941e71e4d2851efb))
* Update inline license to use [@license](https://www.github.com/license) comment ([#67](https://www.github.com/npm/make-fetch-happen/issues/67)) ([f602e06](https://www.github.com/npm/make-fetch-happen/commit/f602e0644c435f7f68b5c17b1b275ad0829b260f))


### dependencies

* http-proxy-agent@5.0.0 ([0013272](https://www.github.com/npm/make-fetch-happen/commit/00132720316b4ed5df66240fe0860f914378addf))
* negotiator@0.6.3 ([70d3496](https://www.github.com/npm/make-fetch-happen/commit/70d3496dbf5badb1fae60fb6bf454313ee6d4648))
* npmlog@6.0.0 ([09ebad1](https://www.github.com/npm/make-fetch-happen/commit/09ebad1c3394ca430a0b65848e9169df1872a35c))
