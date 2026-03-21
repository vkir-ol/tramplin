import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

/*
  точка входа React приложения.
  StrictMode включает дополнительные проверки в dev-режиме
*/


// берем управление всем внутри div
// вызывается компонент App получаем jsx  описание того что нужно нарисовать 
// и превращается в DOM элементы - кнопки, заголовки, формы
createRoot(document.getElementById('root')!).render(
  <StrictMode>   
    <App />
  </StrictMode>
);
