📢 Use this project, [contribute](https://github.com/vtex-apps/b2b-quotes) to it or open issues to help evolve it using [Store Discussion](https://github.com/vtex-apps/store-discussion).

# B2B Quotes & Carts

<!-- DOCS-IGNORE:start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- DOCS-IGNORE:end -->

> ℹ The **B2B Quotes & Carts** app is part of VTEX’s [B2B Suite](https://developers.vtex.com/vtex-developer-docs/docs/vtex-b2b-suite) solution: a collection of apps that allow stores to manage organizations, storefront roles and permissions, and checkout settings for B2B commerce relationships. We recommend that you use it alongside the other apps in this suite for all functionalities to work as expected.

The **B2B Quotes & Carts** app enables price negotiation between buyer organizations and sales representatives, as well as enabling saved cart and order approval flows within each buyer organization.

## Before you start

First, make sure you have the [VTEX IO CLI (Command Line Interface)](https://developers.vtex.com/vtex-developer-docs/docs/vtex-io-documentation-vtex-io-cli-install) installed in your machine.

Along with this app, we recommend installing [B2B Checkout Settings](https://developers.vtex.com/vtex-developer-docs/docs/vtex-b2b-checkout-settings) which includes the addition of some quotes-related functionality to Checkout V6. For example, it will add a "Create Quote" button to the checkout's shopping cart page, as well as "locking" the checkout if a quote is in use (preventing the cart contents from being changed until the order is placed).

Note that installing B2B Quotes & Carts will also result in [Storefront Permissions](https://developers.vtex.com/vtex-developer-docs/docs/vtex-storefront-permissions) being installed as a dependency app – it allows you to grant specific storefront roles for B2B users in an organization. This is especially useful for organizations with multiple users who have different responsibilities, such as placing orders, approving orders or managing the organization users. See the [Storefront Permissions](https://developers.vtex.com/vtex-developer-docs/docs/vtex-storefront-permissions) app documentation for information on the available roles and how to customize their permissions.

If you want to be able to manage roles and permissions on the VTEX Admin, you must install [Storefront Permissions UI](https://developers.vtex.com/vtex-developer-docs/docs/vtex-storefront-permissions-ui) as well.

## Installation

You can install the **B2B Quotes & Carts** app by running `vtex install vtex.b2b-quotes` in your terminal, using the [VTEX IO CLI](https://developers.vtex.com/vtex-developer-docs/docs/vtex-io-documentation-vtex-io-cli-installation-and-command-reference).

## Configuration

To change the app's configuration, access `Apps > My Apps` in the VTEX admin panel, and then click on `B2B Quotes & Carts`.

On this page you may configure the `Default Expiration Date` for new quotes; the default value is 30 days. Note that users with permissions to edit quotes will be able to adjust the expiration dates of individual quotes as needed.

## How the app works

The **B2B Quotes & Carts** app provides a UI for managing quotes and carts in the VTEX IO storefront. This UI can be accessed by navigating to the `/b2b-quotes` route, or by going to `My Account` and clicking the `Quotes and Saved Carts` link in the sidebar. Note that the user must be logged in to be able to access the quotes UI.

Depending on the current user's permissions, this page will show a table containing one of the following:

- all quotes and saved carts created by users in the current user's cost center (if the current user has the `"Access My Cost Center's Quotes and Carts"` permission)
- all quotes and saved carts created by users in the current user's organization (if the current user has the `"Access My Organization's Quotes and Carts"` permission)
- all quotes and saved carts in the current store, regardless of organization (if the current user has the `"Access All Quotes and Carts",` permission)

Each quote and saved cart will show the associated organization and cost center, details about when it was created and who created it, as well as an `Expiration Date` and a `Status`. The possible statuses are:

- `Ready`: The quote or saved cart is ready to be used to place an order
- `Pending`: The quote is waiting for review and adjustment by a sales user
- `Revised`: The quote is waiting for additional review and adjustment by a sales user
- `Declined`: The quote or saved cart has been declined and cannot be used to place an order
- `Expired`: The quote or saved cart has reached its expiration date and cannot be used to place an order
- `Placed`: The quote or saved cart has been used to place an order (and cannot be used again)

From the table, users may click any row to view and/or edit the details of that quote or saved cart (as their permissions allow).

> ℹ Quotes and saved carts use the same data model and are shown together in the same table. The only difference is in the approval flow; in particular, only quotes can have a status of `Pending` or `Revised`, and sales users are not notified when saved carts are created. It is possible to edit a saved cart such that it becomes a quote.

### Creating a quote or saved cart

After adding products to the cart in the usual manner, the contents of the cart can be used to create a saved cart or to request a quote. Both actions can be initiated by navigating to the `/b2b-quotes/create` route, or by clicking the `+ New` button on the main `Quotes and Saved Carts` page. Note that the current user must have the `"Create Quotes and Carts"` permission to perform either action.

The interface will show the contents of the current user's cart in table format. The items in the table, along with the quantities and prices shown, will be saved when the quote or saved cart is created.

Before the quote or saved cart can be created, it must be given a `Reference Name`.

An optional `Notes` field is provided. Notes added here will be visible as part of the quote or saved cart's `Update History`. For example, if a user wishes to request a specific discount from their salesperson, they may include this request as a note.

Clicking `Save For Later` will result in the creation of a saved cart. The status of the newly created saved cart will be set as `Ready`, meaning that it can immediately be used to place an order by any user within that organiation/cost center who has the `"Place Orders from Quotes and Carts"` permission.

Alternatively, clicking `Submit to Sales Rep` will result in the creation of a quote. The status of the newly created quote will be set as `Pending`, meaning that it will need to be reviewed and adjusted by a salesperson before any special discounts can be applied. Note that a `Pending` quote can still be used to place an order, as it is essentially a saved cart at this point, with the original item quantities and prices from the user's minicart.

### Editing a quote

Users (typically sales users) with the `"Edit My Cost Center's Quotes and Carts"`, `"Edit My Organization's Quotes and Carts"`, or `"Edit All Quotes and Carts"` permissions may edit quotes to change the price and/or quantity of each SKU, apply a percentage discount to the entire quote, or change the quote's expiration date.

In regards to discounts, the **B2B Quotes and Carts** app integrates with the [Order Authorization](https://help.vtex.com/en/tutorial/how-order-authorization-works--3MBK6CmKHAuUjMBieDU0pn) system. Specifically, if there is a manual discount rule that will automatically deny a discount above a certain percent, **B2B Quotes and Carts** will not allow a discount above this amount to be applied.

After making any of the above edits on the quote details page, and optionally adding explanatory text in the provided `Notes` field, the user may save the quote by clicking `Save Quote`. This will have the effect of setting the quote's status to `Ready` and notifying any user who has previously interacted with the quote of the change.

### Requesting additional adjustments to a quote

Users (typically buyer organization users) who lack editing permissions but have any of the `"Access Quotes"` permissions may add additional notes to a quote or saved cart if its current status is `Ready`, `Pending`, or `Revised`.

If a quote is `Ready`, meaning that it has been adjusted and saved by a sales user, its status will change to `Revised` if an organization user adds notes and clicks `Submit to Sales Rep`. This is intended as a way for the organization user to request additional adjustments to pricing or quantity. All users who have previously interacted with the quote will receive a notification including the contents of the notes field.

### Declining a quote or saved cart

Users with the `"Decline Quotes and Carts"` permission may decline a quote or saved cart if its current status is `Ready`, `Pending`, or `Revised`. This can be done by clicking the `Decline` button on the quote details page. A declined quote or saved cart can no longer be edited or used to place an order. All users who have previously interacted with the quote will be notified that it has been declined.

### Using a quote or saved cart (placing an order)

Users with the `"Place Orders from Quotes and Carts"` permission may use a quote or saved cart to place an order if its current status is `Ready`, `Pending`, or `Revised`. This can be done by clicking the `Use Quote` button on the quote details page. This will result in the user being redirected to checkout with the contents of the quote or saved cart having been added to their cart. Anything that was already in the user's cart will be cleared.

If [B2B Checkout Settings](https://developers.vtex.com/vtex-developer-docs/docs/vtex-b2b-checkout-settings) is installed, the checkout will be in a "locked" state until the order is placed, meaning that product quantities cannot be changed, and products cannot be added or removed. If a product does not have sufficient available quantity to meet the quantity specified in the quote or saved cart, the quantity will be automatically adjusted. If a given product has no availability, checkout will allow it to be removed from the cart.

Once the order has been placed, the quote or saved cart's status will automatically change to `Placed`, after which point it cannot be used again.

<!-- DOCS-IGNORE:start -->

## Contributors ✨

Thanks goes to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!

<!-- DOCS-IGNORE:end -->
