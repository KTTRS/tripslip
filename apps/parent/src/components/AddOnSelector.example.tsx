/**
 * Example usage of AddOnSelector component
 * 
 * This component allows parents to select optional add-ons for field trips
 * and see the total cost update in real-time.
 */

import { useState } from 'react';
import { AddOnSelector, AdditionalFee } from './AddOnSelector';
import { logger } from '@tripslip/utils';

export function AddOnSelectorExample() {
  const [totalCents, setTotalCents] = useState(0);
  const [selectedAddOns, setSelectedAddOns] = useState<AdditionalFee[]>([]);

  // Example add-ons from an experience's pricing tier
  const addOns: AdditionalFee[] = [
    { name: 'Lunch', amountCents: 800, required: false },
    { name: 'T-Shirt', amountCents: 1500, required: false },
    { name: 'Activity Workbook', amountCents: 500, required: true },
  ];

  const basePriceCents = 2000; // $20.00 base price per student

  const handleTotalChange = (newTotal: number, selected: AdditionalFee[]) => {
    setTotalCents(newTotal);
    setSelectedAddOns(selected);
    logger.debug('Total updated:', newTotal / 100, 'USD');
    logger.debug('Selected add-ons:', selected);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 font-['Fraunces']">
        Field Trip Payment
      </h1>

      <AddOnSelector
        addOns={addOns}
        basePriceCents={basePriceCents}
        onTotalChange={handleTotalChange}
      />

      {/* Example: Use the total for payment processing */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Total: ${(totalCents / 100).toFixed(2)}</p>
        <p>Selected Add-ons: {selectedAddOns.length}</p>
        <ul className="list-disc list-inside">
          {selectedAddOns.map((addon) => (
            <li key={addon.name}>
              {addon.name} - ${(addon.amountCents / 100).toFixed(2)}
              {addon.required && ' (Required)'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Integration with PaymentForm:
 * 
 * ```tsx
 * function PermissionSlipPayment() {
 *   const [totalCents, setTotalCents] = useState(basePriceCents);
 *   const [selectedAddOns, setSelectedAddOns] = useState<AdditionalFee[]>([]);
 * 
 *   return (
 *     <>
 *       <AddOnSelector
 *         addOns={experience.pricingTier.additionalFees}
 *         basePriceCents={experience.pricingTier.priceCents}
 *         onTotalChange={(total, addOns) => {
 *           setTotalCents(total);
 *           setSelectedAddOns(addOns);
 *         }}
 *       />
 * 
 *       <PaymentForm
 *         permissionSlipId={slipId}
 *         amountCents={totalCents}
 *         onSuccess={() => navigate('/payment/success')}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
