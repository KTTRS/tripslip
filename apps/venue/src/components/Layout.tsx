import { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@tripslip/ui'

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b-2 border-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold font-display">TripSlip Venue</h1>
              <div className="hidden md:flex gap-4">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate('/experiences')}>
                  Experiences
                </Button>
                <Button variant="ghost" onClick={() => navigate('/trips')}>
                  Trips
                </Button>
                <Button variant="ghost" onClick={() => navigate('/financials')}>
                  Financials
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
