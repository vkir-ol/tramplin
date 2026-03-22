import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AuthModal } from '../auth/AuthModal';
import { Button } from '../ui/Button';
import styles from './Header.module.css';

/*
Шапка сайта с двумя состояниями:
  Не авторизован - отоброжение кнопки Вход и Регистрация
  Авторизован - ссылка на ЛК, иконка профиля, имя + кнопка ВЫЙТИ
*/


// Путь в ЛК по роли
function getDashboardPath(role: string): string {
  switch (role) {
    case 'APPLICANT': return '/profile';
    case 'EMPLOYER': return '/company';
    case 'CURATOR':
    case 'ADMIN': return '/curator';
    default: return '/';
  }
}

// Русское название роли
const roleLabels: Record<string, string> = {
  APPLICANT: 'Соискатель',
  EMPLOYER: 'Работодатель',
  CURATOR: 'Куратор',
  ADMIN: 'Администратор',
};

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({ isOpen: false, mode: 'login' });

  const openLogin = () => setAuthModal({ isOpen: true, mode: 'login' });
  const openRegister = () => setAuthModal({ isOpen: true, mode: 'register' });
  const closeModal = () => setAuthModal({ isOpen: false, mode: 'login' });

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Логотип — ведёт на главную */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#F19E39"><path d="m140-100-60-60 300-300 160 160 284-320 56 56-340 384-160-160-240 240Zm0-240-60-60 300-300 160 160 284-320 56 56-340 384-160-160-240 240Z"/></svg></span>
            <span className={styles.logoText}>Трамплин</span>
          </Link>

          <div className={styles.actions}>
            {user ? (
              <div className={styles.profile}>
                {/* Клик на аватар/имя - переход в ЛК */}
                <div
                  className={styles.profileLink}
                  onClick={() => navigate(getDashboardPath(user.role))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(getDashboardPath(user.role));
                  }}
                >
                  <div className={styles.avatar}>
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.profileInfo}>
                    <span className={styles.profileName}>{user.displayName}</span>
                    <span className={styles.profileRole}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={logout}>
                  Выйти
                </Button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Button variant="ghost" size="sm" onClick={openLogin}>
                  Вход
                </Button>
                <Button variant="primary" size="sm" onClick={openRegister}>
                  Регистрация
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeModal}
        initialMode={authModal.mode}
      />
    </>
  );
}