import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOpportunity } from '../api/opportunities';
import type { OpportunityRequest, } from '../types';
import { OpportunityType, WorkFormat } from '../types';
import styles from './CreateOpportunity.module.css';
import { getCompanyProfile } from '../api/employer';

/*
    Страница создания карточки возможности
    Доступна только верифицированному работодателю
    После успешного создания — редирект в ЛК работодателя
*/


export default function CreateOpportunity() {
  const navigate = useNavigate();

  // Состояние формы
  const [form, setForm] = useState<OpportunityRequest>({
    title: '',
    description: '',
    type: OpportunityType.INTERNSHIP,
    workFormat: WorkFormat.OFFICE,
    city: '',
    address: null,
    salaryMin: null,
    salaryMax: null,
    expiresAt: null,
    eventDate: null,
    contactEmail: null,
    contactPhone: null,
    contactUrl: null,
  });


  // Состояния UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVerification() {
      try {
        const profile = await getCompanyProfile();
        setVerified(profile.verificationStatus === 'VERIFIED');
      } catch {
        setVerified(false);
      }
    }
    checkVerification();
  }, []);


  // Обработчики изменения полей

  /* Универсальный обработчик для текстовых полей и селектов */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value || null }));
  }

  /* Обработчик для числовых полей (зарплата) */
  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value ? Number(value) : null,
    }));
  }


  // Валидация перед отправкой
  function validate(): string | null {
    if (!form.title.trim()) 
        return 'Укажите название позиции';
    if (form.title.trim().length < 3) 
        return 'Название слишком короткое (минимум 3 символа)';
    if (!form.description.trim()) 
        return 'Заполните описание';
    if (form.description.trim().length < 20) 
        return 'Описание слишком короткое (минимум 20 символов)';
    if (!form.city.trim()) 
        return 'Укажите город';
    if (form.workFormat !== WorkFormat.REMOTE && !form.address?.trim()) {
      return 'Укажите адрес офиса (обязательно для формата "Офис" и "Гибрид")';
    }
    if (form.salaryMin != null && form.salaryMax != null && form.salaryMin > form.salaryMax) {
      return 'Минимальная зарплата не может быть больше максимальной';
    }
    if (form.salaryMin != null && form.salaryMin < 0) {
      return 'Зарплата не может быть отрицательной';
    }
    if (form.type === OpportunityType.EVENT && !form.eventDate) {
      return 'Укажите дату проведения мероприятия';
    }
    if (!form.contactEmail?.trim()) { 
        return 'Укажите контактный email';
    }
    return null;
  }

  // Отправка формы
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Клиентская валидация
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
        const payload = {
            ...form,
            expiresAt: form.expiresAt ? form.expiresAt + 'T00:00:00' : null,
            eventDate: form.eventDate ? form.eventDate + 'T00:00:00' : null,
        };
    await createOpportunity(payload);
    navigate('/company'); // Возврат в ЛК работодателя
    } catch (err: any) {
      // Пытаемся достать сообщение от backend
      const message =
        err?.response?.data?.error?.message || 'Не удалось создать карточку. Попробуйте позже.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Проверка доступа: только верифицированный работодатель
  if (verified === null) {
    return <div className={styles.container}>Загрузка...</div>;
  }

  if (!verified) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <h2>Создание карточки недоступно</h2>
          <p>Чтобы создавать вакансии, компания должна пройти верификацию.</p>
          <button onClick={() => navigate('/company')} className={styles.btnSecondary}>
            Вернуться в личный кабинет
          </button>
        </div>
      </div>
    );
  }

/*
  const categoryLabels: Record<string, string> = {
    LANGUAGE: 'Языки программирования',
    FRAMEWORK: 'Фреймворки и библиотеки',
    LEVEL: 'Уровень',
    EMPLOYMENT_TYPE: 'Тип занятости',
  };
*/

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/company')} className={styles.backBtn}>
          ← Назад
        </button>
        <h1>Новая возможность</h1>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>

        {/* Основная информация */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Основная информация</h2>

          <label className={styles.field}>
            <span className={styles.label}>Название позиции / мероприятия *</span>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Например: Junior Frontend-разработчик"
              className={styles.input}
              maxLength={200}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Описание *</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Опишите обязанности, требования к кандидату или условия."
              className={styles.textarea}
              rows={6}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Тип *</span>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={styles.select}
              >
                <option value={OpportunityType.INTERNSHIP}>Стажировка</option>
                <option value={OpportunityType.VACANCY}>Вакансия</option>
                <option value={OpportunityType.MENTORSHIP}>Менторская программа</option>
                <option value={OpportunityType.EVENT}>Мероприятие</option>
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Формат работы *</span>
              <select
                name="workFormat"
                value={form.workFormat}
                onChange={handleChange}
                className={styles.select}
              >
                <option value={WorkFormat.OFFICE}>Офис</option>
                <option value={WorkFormat.HYBRID}>Гибрид</option>
                <option value={WorkFormat.REMOTE}>Удалённо</option>
              </select>
            </label>
          </div>
        </section>

        {/* ЛОКАЦИЯ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Локация</h2>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Город *</span>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Москва"
                className={styles.input}
              />
            </label>

            {/* Адрес обязателен для OFFICE и HYBRID */}
            {form.workFormat !== WorkFormat.REMOTE && (
              <label className={styles.field}>
                <span className={styles.label}>Адрес офиса *</span>
                <input
                  type="text"
                  name="address"
                  value={form.address || ''}
                  onChange={handleChange}
                  placeholder="ул. Измайловская, д. 7"
                  className={styles.input}
                />
              </label>
            )}
          </div>
        </section>

        {/* ЗАРПЛАТА */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Зарплата</h2>
          <p className={styles.hint}>Необязательно. Если не указать — на карточке будет «По договорённости».</p>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>От</span>
              <input
                type="number"
                name="salaryMin"
                value={form.salaryMin ?? ''}
                onChange={handleNumberChange}
                placeholder="30000"
                className={styles.input}
                min={0}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>До</span>
              <input
                type="number"
                name="salaryMax"
                value={form.salaryMax ?? ''}
                onChange={handleNumberChange}
                placeholder="80000"
                className={styles.input}
                min={0}
              />
            </label>
          </div>
        </section>

        {/* ДАТЫ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Даты</h2>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Срок действия вакансии</span>
              <input
                type="date"
                name="expiresAt"
                value={form.expiresAt || ''}
                onChange={handleChange}
                className={styles.input}
              />
            </label>

            {/* Дата мероприятия — только для типа EVENT */}
            {form.type === OpportunityType.EVENT && (
              <label className={styles.field}>
                <span className={styles.label}>Дата проведения *</span>
                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate || ''}
                  onChange={handleChange}
                  className={styles.input}
                />
              </label>
            )}
          </div>
        </section>

        {/* ТЕГИ — будут доступны после реализации на backend */}
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Теги</h2>
            <p className={styles.hint}>Теги будут доступны позже</p>
        </section>

        {/* КОНТАКТЫ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Контактная информация</h2>
          <p className={styles.hint}>Email обязателен. Остальные контакты — по желанию.</p>

          <div className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                type="email"
                name="contactEmail"
                value={form.contactEmail || ''}
                onChange={handleChange}
                placeholder="sber@mail.com"
                className={styles.input}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Телефон</span>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone || ''}
                onChange={handleChange}
                placeholder="+7 (931) 391-75-04"
                className={styles.input}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Ссылка</span>
              <input
                type="url"
                name="contactUrl"
                value={form.contactUrl || ''}
                onChange={handleChange}
                placeholder="https://sbercompany.com/users"
                className={styles.input}
              />
            </label>
          </div>
        </section>

        {/* КНОПКИ */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => navigate('/company')}
            className={styles.btnSecondary}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className={styles.btnPrimary}
          >
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
}