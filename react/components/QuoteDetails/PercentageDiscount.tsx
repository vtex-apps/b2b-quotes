import React, { Fragment } from 'react'
import { Slider } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'

const PercentageDiscount = ({
  updatingSubtotal,
  originalSubtotal,
  maxDiscountState,
  discountState,
  handlePercentageDiscount,
}: any) => {
  if (
    discountState === 0 ||
    (updatingSubtotal !== undefined &&
      originalSubtotal !== undefined &&
      Math.round(100 - (updatingSubtotal / originalSubtotal) * 100) <=
        maxDiscountState)
  ) {
    return (
      <Fragment>
        <div className="mt5">
          <Slider
            onChange={([value]: [number]) => {
              handlePercentageDiscount(value)
            }}
            min={0}
            max={maxDiscountState}
            step={1}
            disabled={false}
            defaultValues={[0]}
            alwaysShowCurrentValue
            formatValue={(a: number) => `${a}%`}
            value={discountState}
          />
        </div>

        <div className="mt1">
          <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.help-text" />
        </div>
      </Fragment>
    )
  }

  return (
    <div className="mt1">
      <FormattedMessage id="store/b2b-quotes.quote-details.apply-discount.disabled-message" />
    </div>
  )
}

export default PercentageDiscount
