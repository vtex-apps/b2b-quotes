# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Use same component (`QuoteDetails`) for creating and updating quotes, allowing salespeople to create and revise a quote in a single operation

## [0.3.0] - 2022-03-17

### Added

- `Quotes and Saved Carts` link to My Account menu

### Fixed

- When creating new quote, calculate subtotal from list of items rather than using totalizers from orderForm (if items currently have no availability, they will not be included in totalizer amount)
- If a promotion causes two instances of the same SKU to have different selling prices, add them to the quote as separate lines
- Do not allow free items to be added to quote
- Use `network-only` fetch policy when fetching quotes to ensure freshest data
- Remove unnecessary refetches

## [0.2.0] - 2022-03-10

### Added

- UI to change of expiration date by sales role
- Improvement of quote details UI

## [0.1.1] - 2022-03-02

### Fixed

- Clicking on request quote button creates the same quote multiple times
- Fixed the loading button controllers
- Clear cart ui after create quote has been created

## [0.1.0] - 2022-02-23

### Added

- Improvement of Quote Details,
- Calculate the discount against original price (listPrice item)
- If user input some value above from max discount, it's blocked to save, and an alert is shown.

## [0.0.3] - 2022-01-06

## [0.0.2] - 2021-12-23

### Fixed

- Moved app settings from `vtex.b2b-quotes-graphql` to this app so that `vtex.b2b-quotes-graphql` can function as a dependency app without being explicitly installed in a workspace

### Removed

- Unused `getSetupConfig` GraphQL query

## [0.0.1] - 2021-10-06

### Added

- Initial release
