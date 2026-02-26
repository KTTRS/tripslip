import { TripCreationWizard } from '../components/TripCreationWizard';
import { Toaster } from '@tripslip/ui/components/sonner';

export default function CreateTripPage() {
  return (
    <>
      <TripCreationWizard />
      <Toaster />
    </>
  );
}
