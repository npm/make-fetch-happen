# Changelog

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
