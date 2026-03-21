// Модальное окно авторизации

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { RegisterForm } from './RegisterForm';
import { LoginForm } from './LoginForm';
import { useAuth } from '../../hooks/useAuth';

/*
Действия с этим окном:
  Нажатие "Регистрация" - открывается модалка с формой регистрации
  Нажатие "Вход" - открывается модалка с формой входа
  Внутри модалки можно переключаться между формами (ссылка внизу)
  После успешного входа/регистрации модалка закрывается

В завиисмости от выбранного режима(то есть роли):
  'login' — показать форму входа
  'register' — показать форму регистрации
*/

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect( () => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);
  
  const { clearError } = useAuth();

  // Переключение между формами с очисткой ошибок
  const switchToLogin = () => {
    clearError();
    setMode('login');
  };

  const switchToRegister = () => {
    clearError();
    setMode('register');
  };

  // Закрытие модалки с очисткой состояния
  const handleClose = () => {
    clearError();
    onClose();
  };

  const title = mode === 'login' ? 'Вход' : 'Регистрация';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {mode === 'login' ? (
        <LoginForm onSuccess={handleClose} onSwitchToRegister={switchToRegister} />
      ) : (
        <RegisterForm onSuccess={handleClose} onSwitchToLogin={switchToLogin} />
      )}
    </Modal>
  );
}
