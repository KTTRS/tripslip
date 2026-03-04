import { useState, useEffect } from 'react';
import { Checkbox } from '@tripslip/ui';
import { useTranslation } from 'react-i18next';

export interface AdditionalFee {
  name: string;
  amountCents: number;
  required: boolean;
}

interface AddOnSelectorProps {
  addOns: AdditionalFee[];
  basePriceCents: number;
  onTotalChange: (totalCents: number, selectedAddOns: AdditionalFee[]) => void;
}

export function AddOnSelector({ addOns, basePriceCents, onTotalChange }: AddOnSelectorProps) {
  const { t, i18n } = useTranslation();
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  // Initialize with required add-ons
  useEffect(() => {
    const requiredAddOns = new Set(
      addOns.filter(addon => addon.required).map(addon => addon.name)
    );
    setSelectedAddOns(requiredAddOns);
  }, [addOns]);

  // Calculate total whenever selection changes
  useEffect(() => {
    const addOnTotal = addOns
      .filter(addon => selectedAddOns.has(addon.name))
      .reduce((sum, addon) => sum + addon.amountCents, 0);
    
    const total = basePriceCents + addOnTotal;
    const selected = addOns.filter(addon => selectedAddOns.has(addon.name));
    
    onTotalChange(total, selected);
  }, [selectedAddOns, addOns, basePriceCents, onTotalChange]);

  const handleToggleAddOn = (addOnName: string, required: boolean) => {
    if (required) return; // Can't deselect required add-ons

    setSelectedAddOns(prev => {
      const next = new Set(prev);
      if (next.has(addOnName)) {
        next.delete(addOnName);
      } else {
        next.add(addOnName);
      }
      return next;
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const calculateTotal = () => {
    const addOnTotal = addOns
      .filter(addon => selectedAddOns.has(addon.name))
      .reduce((sum, addon) => sum + addon.amountCents, 0);
    return basePriceCents + addOnTotal;
  };

  if (addOns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Add-ons Section */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
        <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
          {t('addOns.title', 'Optional Add-Ons')}
        </h3>
        
        <div className="space-y-3">
          {addOns.map((addon) => {
            const isSelected = selectedAddOns.has(addon.name);
            const isDisabled = addon.required;

            return (
              <label
                key={addon.name}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-[2px] border-[#0A0A0A]
                  transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isSelected 
                    ? 'bg-[#F5C518] shadow-[2px_2px_0px_#0A0A0A]' 
                    : 'bg-white hover:shadow-[2px_2px_0px_#0A0A0A]'
                  }
                  ${isDisabled ? 'opacity-75' : 'cursor-pointer'}
                `}
              >
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  onCheckedChange={() => handleToggleAddOn(addon.name, addon.required)}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                        {addon.name}
                        {addon.required && (
                          <span className="ml-2 text-xs font-medium text-[#0A0A0A] opacity-60">
                            {t('addOns.required', '(Required)')}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <span className="text-sm font-bold text-[#0A0A0A] font-['Space_Mono'] whitespace-nowrap">
                      {formatCurrency(addon.amountCents)}
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="p-6 bg-white border-[2px] border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A]">
        <h3 className="text-lg font-bold text-[#0A0A0A] font-['Fraunces'] mb-4">
          {t('addOns.costBreakdown', 'Cost Breakdown')}
        </h3>
        
        <div className="space-y-3">
          {/* Base Price */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
              {t('addOns.basePrice', 'Base Price')}
            </span>
            <span className="text-sm font-bold text-[#0A0A0A] font-['Space_Mono']">
              {formatCurrency(basePriceCents)}
            </span>
          </div>

          {/* Selected Add-ons */}
          {addOns
            .filter(addon => selectedAddOns.has(addon.name))
            .map(addon => (
              <div key={addon.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
                  {addon.name}
                </span>
                <span className="text-sm font-bold text-[#0A0A0A] font-['Space_Mono']">
                  {formatCurrency(addon.amountCents)}
                </span>
              </div>
            ))}

          {/* Divider */}
          <div className="border-t-[2px] border-[#0A0A0A] my-2" />

          {/* Total */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-base font-bold text-[#0A0A0A] font-['Plus_Jakarta_Sans']">
              {t('addOns.total', 'Total')}
            </span>
            <span className="text-2xl font-bold text-[#0A0A0A] font-['Space_Mono']">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
