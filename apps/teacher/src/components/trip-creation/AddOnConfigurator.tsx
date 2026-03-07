import { useState, useEffect } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Input } from '@tripslip/ui/components/input';
import { Label } from '@tripslip/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tripslip/ui/components/select';
import { Switch } from '@tripslip/ui/components/switch';
import { Badge } from '@tripslip/ui/components/badge';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';

export interface ConfiguredAddOn {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  required: boolean;
  category: 'gift_shop' | 'food_snacks' | 'souvenirs' | 'activity_upgrade' | 'other';
}

const CATEGORY_LABELS: Record<ConfiguredAddOn['category'], string> = {
  gift_shop: 'Gift Shop',
  food_snacks: 'Food/Snacks',
  souvenirs: 'Souvenirs',
  activity_upgrade: 'Activity Upgrade',
  other: 'Other',
};

interface AddOnConfiguratorProps {
  addOns: ConfiguredAddOn[];
  onChange: (addOns: ConfiguredAddOn[]) => void;
  experienceAdditionalFees?: Array<{ name: string; amountCents: number; required: boolean }>;
}

export function AddOnConfigurator({ addOns, onChange, experienceAdditionalFees }: AddOnConfiguratorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [required, setRequired] = useState(false);
  const [category, setCategory] = useState<ConfiguredAddOn['category']>('other');
  const [hasPrePopulated, setHasPrePopulated] = useState(false);

  useEffect(() => {
    if (experienceAdditionalFees && experienceAdditionalFees.length > 0 && addOns.length === 0 && !hasPrePopulated) {
      const prePopulated = experienceAdditionalFees.map((fee, idx) => ({
        id: `venue-fee-${idx}-${Date.now()}`,
        name: fee.name,
        description: '',
        priceCents: fee.amountCents,
        required: fee.required,
        category: 'other' as const,
      }));
      onChange(prePopulated);
      setHasPrePopulated(true);
    }
  }, [experienceAdditionalFees, addOns.length, hasPrePopulated, onChange]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPriceStr('');
    setRequired(false);
    setCategory('other');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const priceCents = Math.round(parseFloat(priceStr || '0') * 100);
    if (isNaN(priceCents) || priceCents < 0) return;

    if (editingId) {
      onChange(addOns.map(a => a.id === editingId ? {
        ...a, name: name.trim(), description: description.trim(), priceCents, required, category,
      } : a));
    } else {
      const newAddOn: ConfiguredAddOn = {
        id: `addon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        description: description.trim(),
        priceCents,
        required,
        category,
      };
      onChange([...addOns, newAddOn]);
    }
    resetForm();
  };

  const handleEdit = (addon: ConfiguredAddOn) => {
    setName(addon.name);
    setDescription(addon.description);
    setPriceStr((addon.priceCents / 100).toFixed(2));
    setRequired(addon.required);
    setCategory(addon.category);
    setEditingId(addon.id);
    setShowForm(true);
  };

  const handleRemove = (id: string) => {
    onChange(addOns.filter(a => a.id !== id));
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Card className="border-2 border-[#0A0A0A]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#0A0A0A]" />
          Add-On Options for Parents
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure optional or required extras that parents can select when paying
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {addOns.length > 0 && (
          <div className="space-y-2">
            {addOns.map((addon) => (
              <div
                key={addon.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#0A0A0A]">{addon.name}</span>
                    <Badge variant="outline" className="text-xs border-[#0A0A0A]">
                      {CATEGORY_LABELS[addon.category]}
                    </Badge>
                    {addon.required && (
                      <Badge className="text-xs bg-red-100 text-red-700 border border-red-300">
                        Required
                      </Badge>
                    )}
                  </div>
                  {addon.description && (
                    <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="text-sm font-bold text-[#0A0A0A] whitespace-nowrap">
                    {formatCurrency(addon.priceCents)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(addon)}
                    className="text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(addon.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <div className="p-4 border-2 border-dashed border-[#F5C518] rounded-lg bg-[#FFFDE7] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addon-name">Name *</Label>
                <Input
                  id="addon-name"
                  placeholder="e.g., Gift Shop Allowance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-[#0A0A0A]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addon-price">Price ($) *</Label>
                <Input
                  id="addon-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  className="border-2 border-[#0A0A0A]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addon-description">Description</Label>
              <Input
                id="addon-description"
                placeholder="Brief description for parents"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2 border-[#0A0A0A]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addon-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ConfiguredAddOn['category'])}>
                  <SelectTrigger id="addon-category" className="border-2 border-[#0A0A0A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="addon-required"
                  checked={required}
                  onCheckedChange={setRequired}
                />
                <Label htmlFor="addon-required" className="cursor-pointer">Required for all parents</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:shadow-[8px_8px_0px_#0A0A0A] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 font-semibold"
              >
                {editingId ? 'Update Add-On' : 'Add'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-2 border-[#0A0A0A]"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-[#0A0A0A] hover:bg-[#FFFDE7] hover:border-[#F5C518]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add an option for parents
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
