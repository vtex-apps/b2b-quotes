# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
