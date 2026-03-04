import { useState, useEffect } from 'react';
import { Button } from '@tripslip/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tripslip/ui/components/card';
import { Alert, AlertDescription } from '@tripslip/ui/components/alert';
import { Badge } from '@tripslip/ui/components/badge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface StripeAccount {
  id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export function StripeConnectSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadStripeAccountStatus();
    }
  }, [user]);

  const loadStripeAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get venue_id for current user
      const { data: venueUser, error: venueError } = await supabase
        .from('venue_users')
        .select('venue_id')
        .eq('user_id', user!.id)
        .single();

      if (venueError) throw venueError;
      if (!venueUser) throw new Error('Venue not found for user');

      setVenueId(venueUser.venue_id);

      // Get venue's Stripe account info
      const { data: venue, error: venueDataError } = await supabase
        .from('venues')
        .select('stripe_account_id, stripe_account_status')
        .eq('id', venueUser.venue_id)
        .single();

      if (venueDataError) throw venueDataError;

      if (venue?.stripe_account_id) {
        // Fetch account details from Stripe
        const { data: accountData, error: accountError } = await supabase.functions.invoke(
          'get-stripe-account',
          {
            body: {
              accountId: venue.stripe_account_id
            }
          }
        );

        if (accountError) throw accountError;
        setStripeAccount(accountData);
      }
    } catch (err) {
      console.error('Error loading Stripe account status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Stripe account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!venueId) return;

    try {
      setConnecting(true);
      setError(null);

      // Create Stripe Connect account link
      const { data, error } = await supabase.functions.invoke('create-stripe-connect-link', {
        body: {
          venueId,
          returnUrl: `${window.location.origin}/financials?setup=complete`,
          refreshUrl: `${window.location.origin}/financials?setup=refresh`
        }
      });

      if (error) throw error;

      // Redirect to Stripe Connect onboarding
      window.location.href = data.url;
    } catch (err) {
      console.error('Error creating Stripe Connect link:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Stripe');
      setConnecting(false);
    }
  };

  const getAccountStatus = () => {
    if (!stripeAccount) return null;

    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return {
        status: 'active',
        label: 'Active',
        description: 'Your account is fully set up and ready to receive payments',
        icon: CheckCircle,
        color: 'text-green-600'
      };
    }

    if (stripeAccount.details_submitted) {
      return {
        status: 'pending',
        label: 'Pending Verification',
        description: 'Your account is under review. This usually takes 1-2 business days.',
        icon: Clock,
        color: 'text-yellow-600'
      };
    }

    return {
      status: 'incomplete',
      label: 'Setup Required',
      description: 'Please complete your account setup to start receiving payments',
      icon: AlertCircle,
      color: 'text-red-600'
    };
  };

  const accountStatus = getAccountStatus();

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Stripe account status...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)]">
      <CardHeader>
        <CardTitle className="font-['Fraunces'] text-2xl font-bold">
          Stripe Connect Setup
        </CardTitle>
        <CardDescription className="font-['Plus_Jakarta_Sans']">
          Connect your Stripe account to receive payments from bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-2 border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 font-['Plus_Jakarta_Sans']">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!stripeAccount ? (
          <div className="text-center space-y-4">
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 font-['Plus_Jakarta_Sans']">
                No Stripe Account Connected
              </h3>
              <p className="text-gray-600 mb-4 font-['Plus_Jakarta_Sans']">
                Connect your Stripe account to start receiving payments from venue bookings.
                Stripe handles all payment processing securely.
              </p>
              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:shadow-[8px_8px_0px_0px_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200 font-['Plus_Jakarta_Sans'] font-bold"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {connecting ? 'Connecting...' : 'Connect with Stripe'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {accountStatus && (
                <>
                  <accountStatus.icon className={`h-5 w-5 ${accountStatus.color}`} />
                  <Badge 
                    variant={accountStatus.status === 'active' ? 'success' : 
                            accountStatus.status === 'pending' ? 'yellow' : 'error'}
                  >
                    {accountStatus.label}
                  </Badge>
                </>
              )}
            </div>

            {accountStatus && (
              <p className="text-gray-600 font-['Plus_Jakarta_Sans']">
                {accountStatus.description}
              </p>
            )}

            {/* Account capabilities */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-2 border-black rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {stripeAccount.charges_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-semibold font-['Plus_Jakarta_Sans']">
                    Accept Payments
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                  {stripeAccount.charges_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>

              <div className="p-4 border-2 border-black rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  {stripeAccount.payouts_enabled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-semibold font-['Plus_Jakarta_Sans']">
                    Receive Payouts
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                  {stripeAccount.payouts_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            {/* Requirements */}
            {stripeAccount.requirements.currently_due.length > 0 && (
              <Alert className="border-2 border-yellow-500 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-600 font-['Plus_Jakarta_Sans']">
                  <strong>Action Required:</strong> You have {stripeAccount.requirements.currently_due.length} 
                  {' '}requirement(s) that need to be completed to activate your account.
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                variant="outline"
                className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {connecting ? 'Loading...' : 'Manage Account'}
              </Button>
              
              <Button
                onClick={loadStripeAccountStatus}
                variant="outline"
                className="border-2 border-black hover:bg-gray-100 font-['Plus_Jakarta_Sans'] font-semibold"
              >
                Refresh Status
              </Button>
            </div>
          </div>
        )}

        {/* Information section */}
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h4 className="font-semibold mb-2 font-['Plus_Jakarta_Sans']">
            About Stripe Connect
          </h4>
          <ul className="text-sm text-gray-600 space-y-1 font-['Plus_Jakarta_Sans']">
            <li>• Secure payment processing for all bookings</li>
            <li>• Automatic payouts to your bank account</li>
            <li>• Built-in fraud protection and dispute management</li>
            <li>• Detailed transaction reporting and analytics</li>
            <li>• PCI compliance handled automatically</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}