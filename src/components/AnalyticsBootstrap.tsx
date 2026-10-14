import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { trackRouteView, trackSessionStart } from '../lib/analytics'

/**
 * Starts session + route tracking. Fail-silent; never blocks render.
 */
export function AnalyticsBootstrap() {
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    trackSessionStart(user?.id ?? null)
  }, [user?.id])

  useEffect(() => {
    trackRouteView(location.pathname)
  }, [location.pathname])

  return null
}
