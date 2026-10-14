import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AdminGate } from './components/AdminGate'
import { AnalyticsBootstrap } from './components/AnalyticsBootstrap'
import { AppNav } from './components/AppNav'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LanguageChoiceSheet } from './components/LanguageChoiceSheet'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { LocaleProvider } from './context/LocaleContext'
import { OwnershipProvider } from './context/OwnershipContext'
import { PatternsProvider } from './context/PatternsContext'
import { ProgressProvider } from './context/ProgressContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { StashProvider } from './context/StashContext'
import { AccountPage } from './pages/AccountPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage'
import { ExplorePage } from './pages/ExplorePage'
import { MyPatternsPage } from './pages/MyPatternsPage'
import { PatternDetailPage } from './pages/PatternDetailPage'
import { PatternReaderPage } from './pages/PatternReaderPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { YarnStashPage } from './pages/YarnStashPage'
import { AdminInnsiktPage } from './pages/admin/AdminInnsiktPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminPatternEditPage } from './pages/admin/AdminPatternEditPage'
import { AdminPatternsPage } from './pages/admin/AdminPatternsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminYarnsPage } from './pages/admin/AdminYarnsPage'
import './App.css'

function AdminRoutes() {
  return (
    <AdminGate>
      <AdminLayout />
    </AdminGate>
  )
}

function AppChrome() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className={isAdminRoute ? 'admin-root' : 'app-shell'}>
      <LanguageChoiceSheet />
      <AnalyticsBootstrap />
      {!isAdminRoute && <AppNav />}
      <Routes>
        <Route path="/admin" element={<AdminRoutes />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="innsikt" element={<AdminInnsiktPage />} />
          <Route path="oppskrifter" element={<AdminPatternsPage />} />
          <Route path="oppskrifter/new" element={<AdminPatternEditPage />} />
          <Route path="oppskrifter/:id" element={<AdminPatternEditPage />} />
          <Route path="garn" element={<AdminYarnsPage />} />
          <Route path="innstillinger" element={<AdminSettingsPage />} />
        </Route>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/oppskrift/:id" element={<PatternDetailPage />} />
        <Route path="/oppskrift/:id/les" element={<PatternReaderPage />} />
        <Route path="/kurv" element={<CartPage />} />
        <Route path="/kasse" element={<CheckoutPage />} />
        <Route path="/kasse/suksess" element={<CheckoutSuccessPage />} />
        <Route path="/mine" element={<MyPatternsPage />} />
        <Route path="/garnlager" element={<YarnStashPage />} />
        <Route path="/prosjekter" element={<ProjectsPage />} />
        <Route path="/konto" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocaleProvider>
          <PatternsProvider>
            <OwnershipProvider>
              <CartProvider>
                <ProgressProvider>
                  <StashProvider>
                    <ProjectsProvider>
                      <BrowserRouter>
                        <AppChrome />
                      </BrowserRouter>
                    </ProjectsProvider>
                  </StashProvider>
                </ProgressProvider>
              </CartProvider>
            </OwnershipProvider>
          </PatternsProvider>
        </LocaleProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
