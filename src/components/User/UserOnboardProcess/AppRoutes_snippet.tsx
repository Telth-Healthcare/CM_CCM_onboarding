

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
    <Route path="/onboardProcess/personal-info"       element={<OnboardRouter />} />
    <Route path="/onboardProcess/address-info"        element={<OnboardRouter />} />
    <Route path="/onboardProcess/personal-documents"  element={<OnboardRouter />} />
    <Route path="/onboardProcess/education-documents" element={<OnboardRouter />} />
    <Route path="/onboardProcess/preview"             element={<OnboardRouter />} />
    {/* Default: redirect bare /onboardProcess to first step */}
    <Route path="/onboardProcess" element={<OnboardRouter />} />
  </>
)
