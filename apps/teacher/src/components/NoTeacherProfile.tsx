import { useNavigate } from 'react-router';
import { Button } from '@tripslip/ui';

export function NoTeacherProfile() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_#0A0A0A] p-8 text-center bg-white">
        <img src="/images/char-pink-heart.png" alt="" className="w-24 h-24 mx-auto mb-6 object-contain" />
        <h2 className="font-display text-3xl font-bold text-[#0A0A0A] mb-3">Welcome to TripSlip!</h2>
        <p className="text-gray-600 mb-8">
          Your account isn't linked to a teacher profile yet. This usually happens automatically when you sign up. Try signing out and back in, or contact your school administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate('/profile')}
            className="bg-[#F5C518] text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold px-6 py-3"
          >
            Go to Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
