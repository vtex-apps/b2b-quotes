import { defineMessages } from 'react-intl'

const storePrefix = 'store/b2b-quotes.'
const adminPrefix = 'admin/b2b-quotes.'

export const quoteMessages = defineMessages({
  updateSuccess: {
    id: `${storePrefix}quote-details.update-success`,
  },
  updateError: {
    id: `${storePrefix}quote-details.update-error`,
  },
  useQuote: {
    id: `${storePrefix}quote-details.use-quote`,
  },
  useError: {
    id: `${storePrefix}quote-details.use-error`,
  },
  updatePageTitle: {
    id: `${storePrefix}quote-details.title`,
  },
  back: {
    id: `${storePrefix}back`,
  },
  subtotal: {
    id: `${storePrefix}quote-details.subtotal.title`,
  },
  expiration: {
    id: `${storePrefix}quote-details.expiration.title`,
  },
  status: {
    id: `${storePrefix}quote-details.status.title`,
  },
  image: {
    id: `${storePrefix}quote-details.items.image.title`,
  },
  refCode: {
    id: `${storePrefix}quote-details.items.refId.title`,
  },
  name: {
    id: `${storePrefix}quote-details.items.name.title`,
  },
  price: {
    id: `${storePrefix}quote-details.items.price.title`,
  },
  quantity: {
    id: `${storePrefix}quote-details.items.quantity.title`,
  },
  total: {
    id: `${storePrefix}quote-details.items.total.title`,
  },
  addNote: {
    id: `${storePrefix}quote-details.add-note.label`,
  },
  percentageDiscount: {
    id: `${storePrefix}quote-details.percentage-discount.title`,
  },
  quotedSubtotal: {
    id: `${storePrefix}quote-details.quoted-subtotal.title`,
  },
  originalSubtotal: {
    id: `${storePrefix}quote-details.original-subtotal.title`,
  },
  quotePrice: {
    id: `${storePrefix}quote-details.quote-price.title`,
  },
  originalPrice: {
    id: `${storePrefix}quote-details.original-price.title`,
  },
  expirationDateChange: {
    id: `${storePrefix}quote-details.expiration-date-change.title`,
  },
  productsTitle: {
    id: `${storePrefix}quote-details.products.title`,
  },
  historyTitle: {
    id: `${storePrefix}quote-details.update-history.title`,
  },
  notesAfterCreatedHelpText: {
    id: `${storePrefix}quote-details.notes-after-created.helpText`,
  },
  createPageTitle: {
    id: `${storePrefix}create.title`,
  },
  createSuccess: {
    id: `${storePrefix}create.success`,
  },
  createError: {
    id: `${storePrefix}create.error`,
  },
  required: {
    id: `${storePrefix}create.required`,
  },
  placeholderName: {
    id: `${storePrefix}create.placeholder.quotationName`,
  },
  labelName: {
    id: `${storePrefix}create.nameLabel`,
  },
  emptyState: {
    id: `${storePrefix}create.empty-state-label`,
  },
})

export const tableMessages = defineMessages({
  details: {
    id: `${storePrefix}quotes-table.details.label`,
  },
  refName: {
    id: `${storePrefix}quotes-table.referenceName.title`,
  },
  subtotal: {
    id: `${storePrefix}quotes-table.subtotal.title`,
  },
  email: {
    id: `${storePrefix}quotes-table.creatorEmail.title`,
  },
  creationDate: {
    id: `${storePrefix}quotes-table.creationDate.title`,
  },
  expirationDate: {
    id: `${storePrefix}quotes-table.expirationDate.title`,
  },
  status: {
    id: `${storePrefix}quotes-table.status.title`,
  },
  lastUpdate: {
    id: `${storePrefix}quotes-table.lastUpdate.title`,
  },
  organization: {
    id: `${storePrefix}quotes-table.organization.title`,
  },
  costCenter: {
    id: `${storePrefix}quotes-table.costCenter.title`,
  },
  organizationAndCostCenter: {
    id: `${storePrefix}quotes-table.orgAndCostCenter.title`,
  },
  searchOrganization: {
    id: `${storePrefix}quotes-table.searchOrganization.title`,
  },
  searchCostCenter: {
    id: `${storePrefix}quotes-table.searchCostCenter.title`,
  },
  any: {
    id: `${storePrefix}quotes-table.filters.any`,
  },
  is: {
    id: `${storePrefix}quotes-table.filters.is`,
  },
  emptyState: {
    id: `${storePrefix}quotes-table.empty-state-label`,
  },
  showRows: {
    id: `${storePrefix}quotes-table.showRows`,
  },
  of: {
    id: `${storePrefix}quotes-table.of`,
  },
  placeholderSearch: {
    id: `${storePrefix}quotes-table.search.placeholder`,
  },
  toggleFields: {
    id: `${storePrefix}quotes-table.toggleFields.label`,
  },
  showAllFields: {
    id: `${storePrefix}quotes-table.toggleFields.showAllLabel`,
  },
  hideAllFields: {
    id: `${storePrefix}quotes-table.toggleFields.hideAllLabel`,
  },
  newQuote: {
    id: `${storePrefix}quotes-table.newLine.label`,
  },
  clearFilters: {
    id: `${storePrefix}quotes-table.clearFilters.label`,
  },
  statusFilter: {
    id: `${storePrefix}quotes-table.statusFilter.label`,
  },
  filtersAll: {
    id: `${storePrefix}quotes-table.filters.all`,
  },
  filtersNone: {
    id: `${storePrefix}quotes-table.filters.none`,
  },
  filtersIncludes: {
    id: `${storePrefix}quotes-table.filters.includes`,
  },
})

export const statusMessages = defineMessages({
  ready: {
    id: `${storePrefix}quote-status.ready`,
  },
  placed: {
    id: `${storePrefix}quote-status.placed`,
  },
  declined: {
    id: `${storePrefix}quote-status.declined`,
  },
  expired: {
    id: `${storePrefix}quote-status.expired`,
  },
  pending: {
    id: `${storePrefix}quote-status.pending`,
  },
  revised: {
    id: `${storePrefix}quote-status.revised`,
  },
})

export const adminMessages = defineMessages({
  settingsPageTitle: {
    id: `${adminPrefix}settings.title`,
  },
  saveSettingsFailure: {
    id: `${adminPrefix}settings.saveSettings.failure`,
  },
  saveSettingsSuccess: {
    id: `${adminPrefix}settings.saveSettings.success`,
  },
  cartLifeSpanLabel: {
    id: `${adminPrefix}settings.cartLifeSpan.label`,
  },
  saveSettingsButtonText: {
    id: `${adminPrefix}settings.saveSettings.buttonText`,
  },
})
