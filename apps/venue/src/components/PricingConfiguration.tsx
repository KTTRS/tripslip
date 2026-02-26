import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent } from '@tripslip/ui/components/card';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tripslip/ui/components/select';
import { Plus, X } from 'lucide-react';

export interface PricingTier {
  id: string;
  min_students: number;
  max_students: number;
  price_cents: number;
  free_chaperones: number;
  type: 'per_student' | 'flat_rate' | 'group_discount';
}

interface PricingConfigurationProps {
  pricingTiers: PricingTier[];
  onChange: (tiers: PricingTier[]) => void;
}

export function PricingConfiguration({ pricingTiers, onChange }: PricingConfigurationProps) {
  const addTier = () => {
    const newTier: PricingTier = {
      id: `temp-${Date.now()}`,
      min_students: 1,
      max_students: 30,
      price_cents: 1500,
      free_chaperones: 2,
      type: 'per_student'
    };
    onChange([...pricingTiers, newTier]);
  };
  
  const removeTier = (index: number) => {
    onChange(pricingTiers.filter((_, i) => i !== index));
  };
  
  const updateTier = (index: number, field: keyof PricingTier, value: any) => {
    const newTiers = [...pricingTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    onChange(newTiers);
  };
  
  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
  };
  
  const parseCurrency = (value: string) => {
    return Math.round(parseFloat(value) * 100);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Configure pricing tiers for different group sizes
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addTier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tier
        </Button>
      </div>
      
      {pricingTiers.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-gray-600 mb-2">No pricing tiers configured</p>
            <p className="text-sm text-gray-500 mb-4">
              Add pricing tiers to set different rates for group sizes
            </p>
            <Button type="button" variant="outline" onClick={addTier}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Tier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pricingTiers.map((tier, index) => (
            <Card key={tier.id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-semibold">Tier {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTier(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pricing Type</Label>
                    <Select
                      value={tier.type}
                      onValueChange={(value) => updateTier(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_student">Per Student</SelectItem>
                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                        <SelectItem value="group_discount">Group Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formatCurrency(tier.price_cents)}
                      onChange={(e) => updateTier(index, 'price_cents', parseCurrency(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Min Students</Label>
                    <Input
                      type="number"
                      value={tier.min_students}
                      onChange={(e) => updateTier(index, 'min_students', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Students</Label>
                    <Input
                      type="number"
                      value={tier.max_students}
                      onChange={(e) => updateTier(index, 'max_students', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Free Chaperones</Label>
                    <Input
                      type="number"
                      value={tier.free_chaperones}
                      onChange={(e) => updateTier(index, 'free_chaperones', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    {tier.type === 'per_student' && (
                      <>
                        <strong>${formatCurrency(tier.price_cents)}</strong> per student for groups of{' '}
                        <strong>{tier.min_students}-{tier.max_students}</strong> students
                      </>
                    )}
                    {tier.type === 'flat_rate' && (
                      <>
                        <strong>${formatCurrency(tier.price_cents)}</strong> flat rate for groups of{' '}
                        <strong>{tier.min_students}-{tier.max_students}</strong> students
                      </>
                    )}
                    {tier.type === 'group_discount' && (
                      <>
                        <strong>${formatCurrency(tier.price_cents)}</strong> per student (discounted) for groups of{' '}
                        <strong>{tier.min_students}-{tier.max_students}</strong> students
                      </>
                    )}
                    {tier.free_chaperones > 0 && (
                      <> • {tier.free_chaperones} free chaperone(s)</>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
