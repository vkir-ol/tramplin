import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { ProtectedRoute } from './components/route/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ApplicantDashboard } from './pages/ApplicantDashboard';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { CuratorDashboard } from './pages/CuratorDashboard';

/*
Корневой компонент приложения
 
  AuthProvider — оборачивает всё приложение, даёт доступ к useAuth()
  любой компонент здесь может узнать вошел ли пользователь, 
  какая у него роль и вызвать функции login logout

  BrowserRouter — слушает url когда переходим по ссылке он узнает это
  и обращается к реакту что url изменился нужно показать другой контент

Routes — маршруты страниц
  /profile — личный кабинет соискателя
  /company — личный кабинет работодателя
  /admin — панель куратора
  /vacancy/:id — карточка возможности

*/

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT']}>
                <ApplicantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/company"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYER']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/curator"
            element={
              <ProtectedRoute allowedRoles={['CURATOR', 'ADMIN']}>
                <CuratorDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;