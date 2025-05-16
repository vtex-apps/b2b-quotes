# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.3] - 2025-05-16

### Added
- Updated documentation to include details about the creation of the "quotes" data entity when installing the B2B Quotes & Carts app.

### Fixed
- Updated pull request workflows

## [1.7.2] - 2025-02-24

### Changed
- Updated documentation section "Email templates"

## [1.7.1] - 2025-01-27

### Fixed

- Enable comments in seller quotes after split

### Added

- Check seller quotes on quote creation
- Display quotes tables with seller quotes if the quote was splitted
- Display quotes children quantity and seller trade name when there are splitted quotes

## [1.7.0] - 2025-01-21
### Added

- Add new splitting quote configuration to settings UI

## [1.6.6] - 2025-01-06
### Fixed
- Fix Request Quote message in Quotes Details

### Added

- Add new splitting quote configuration to settings UI

## [1.6.6] - 2025-01-06
### Fixed
- Fix Request Quote message in Quotes Details

## [1.6.5] - 2024-09-26
### Fixed

- Fix validation and submit on lifespan settings for quotes

## [1.6.4] - 2024-09-05

### Fixed
- Use getQuotesEnabledForUser instead of getUserByEmail to define "My Quotes" button visibility

## [1.6.3] - 2024-09-04

### Fixed

- Translations for all Storefront languages.

## [1.6.2] - 2024-08-15

### Removed
- Removed cost center id from metrics

## [1.6.1] - 2024-06-20

### Fixed

- Fixed that if there is another custom application in the custom data, the "B2BQuotesLockingModal.tsx" component would break on its own.

## [1.6.0] - 2023-08-10

+ ### Added
+ - Quotation created metrics sent to Analytics Redshift
+ - Use quote metrics sent to Analytics Redshift

## [1.5.5] - 2023-06-29

### Fixed

- Change to use price instead of list price in quote features(view, discount and update selling price)

## [1.5.4] - 2023-05-08

### Fixed

- Fixed status filter locale in my quotes page

### Removed

- [ENGINEERS-1247] - Disable cypress tests in PR level

### Changed

- Run schedule job only on saturday

## [1.5.3] - 2023-01-03

## [1.5.2] - 2022-12-02

### Changed

- Updated cypress strategy

### Fixed

- Fixed org & cost center filter in my quotes

## [1.5.1] - 2022-11-08

### Changed

- Upgrade minimist package due a prototype pollution security vulnerability

### Changed

- Split bindings testcase into two files

### Changed

- Update GitHub reusable workflow to version 2

## [1.5.0] - 2022-08-25

### Added

- Permission to `Access All Sales Channels' Quotes and Carts` option for roles

## [1.4.1] - 2022-08-19

### Fixed

- Updated admin-ui packages, NumericStepper is now NumberInput

## [1.4.0] - 2022-08-11

### Added

- Complete Portuguese translations
- A mechanism to translate quote status into multiple languages

### Fixed

- Arabic, Bulgarian, Catalan, Czech, Danish, Dutch, German, Greek, English, Finnish, French, Italian, Japanese, Korean, Norwegian, Polish, Portuguese, Romanian, Russian, Slovak, Slovenian, Spanish, Swedish, Thai and Ukrainian.

## [1.3.3] - 2022-08-03

### Added

- Added the feature that the b2b quote link will hide for b2c users

## [1.3.2] - 2022-08-03

### Fixed

- Bug fixed on decline quote

## [1.3.1] - 2022-08-02

### Fixed

- English translation.

## [1.3.0] - 2022-07-21

### Added

- Translations for all Storefront languages.

### Fixed

- English, Portuguese and Romanian translations.

## [1.2.2] - 2022-07-06

### Fixed

- Fix missing seller when creating new quotes

## [1.2.1] - 2022-07-04

### Added

- Initial Crowdin integration

## [1.2.0] - 2022-06-28

### Added

- UX adjustments on Alert messages and action buttons positions.
- It was reorganized the code and split components into small pieces.

## [1.1.1] - 2022-06-06

### Fixed

- Filter error if no quotes have been created yet

## [1.1.0] - 2022-05-19

### Added

- Improved organization/cost center filtering on `QuotesTable` component

## [1.0.1] - 2022-04-26

### Fixed

- fix on discounts negative
- NaN total when quoted price is empty
- fix on handling quantity
- fix on difference between input and slider discount
- fix on slider discount bar
- fix on orderform graphql query by adding "network-only"

## [1.0.0] - 2022-04-14

### Added

- Admin panel for app settings

### Removed

- Billing options
- `settingsSchema`
- Legacy `CreateQuote` component

## [0.5.1] - 2022-04-05

### Added

- Documentation

## [0.5.0] - 2022-03-24

### Added

Added a modal component that verifies if the quoteId is on the orderForm and locks by opening the modal component if the user tries to browse other pages instead of the checkout page.

## [0.4.0] - 2022-03-22

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
