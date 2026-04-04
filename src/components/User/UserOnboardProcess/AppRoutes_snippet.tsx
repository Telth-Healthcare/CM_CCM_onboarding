

import { Route, useLocation } from 'react-router-dom'
import { STEPS } from './types/Constants'
import CCMOnboard from './Onboard'


function OnboardRouter() {
  const location   = useLocation()
  const currentId  = location.pathname.split('/').pop() ?? 'personal-info'
  const idx        = STEPS.findIndex(s => s.id === currentId)
  const currentIndex = idx >= 0 ? idx : 0

  return <CCMOnboard currentId={currentId} currentIndex={currentIndex} />
}

export const onboardRoutes = (
  <>
    <Route path="/ccmonboard/personal-info"       element={<OnboardRouter />} />
    <Route path="/ccmonboard/address-info"        element={<OnboardRouter />} />
    <Route path="/ccmonboard/personal-documents"  element={<OnboardRouter />} />
    <Route path="/ccmonboard/education-documents" element={<OnboardRouter />} />
    <Route path="/ccmonboard/preview"             element={<OnboardRouter />} />
    {/* Default: redirect bare /ccmonboard to first step */}
    <Route path="/ccmonboard" element={<OnboardRouter />} />
  </>
)
