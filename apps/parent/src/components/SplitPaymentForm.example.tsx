import { SplitPaymentForm } from './SplitPaymentForm';

/**
 * Example usage of SplitPaymentForm component
 * 
 * This component demonstrates how to integrate split payment functionality
 * into the parent app payment flow.
 */
export function SplitPaymentFormExample() {
  const handlePaymentSuccess = () => {
    console.log('Split payment completed successfully!');
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error: string) => {
    console.error('Split payment failed:', error);
    // Show error message to user
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Split Payment Example</h1>
      
      <SplitPaymentForm
        permissionSlipId="example-slip-123"
        totalAmountCents={5000} // $50.00
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Payment Summary - Shows total cost, paid amount, and remaining balance
 * 2. Previous Contributions - Lists existing payments from other contributors
 * 3. Contributor Information - Collects name and email for payment tracking
 * 4. Flexible Amount Entry - Allows custom amounts with quick percentage buttons
 * 5. Stripe Integration - Secure payment processing with Stripe Elements
 * 6. Validation - Prevents overpayment and validates required fields
 * 7. Multi-language Support - Uses i18next for translations
 * 8. Accessibility - Proper ARIA labels and keyboard navigation
 * 9. Error Handling - Graceful error display and recovery
 * 10. Loading States - Shows appropriate loading indicators
 */