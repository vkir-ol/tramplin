import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOpportunityById } from '../api/opportunities';
import { useAuth } from '../hooks/useAuth';
import type { OpportunityResponse } from '../types';
import { OpportunityType, WorkFormat } from '../types';
import styles from './OpportunityPage.module.css';
import { useFavorites } from '../hooks/useFavorites';
/*
    Публичная страница просмотра карточки возможности.
    Доступна всем — авторизованным и гостям.
*/
export default function OpportunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [opportunity, setOpportunity] = useState<OpportunityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getOpportunityById(id);
        setOpportunity(data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setError('Карточка не найдена');
        } else {
          setError('Не удалось загрузить данные');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>Загрузка карточки...</div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>{error || 'Что-то пошло не так'}</h2>
          <button onClick={() => navigate('/')} className={styles.btnSecondary}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  // Вспомогательные функции для отображения
  function formatType(type: OpportunityType): string {
    const map: Record<OpportunityType, string> = {
      [OpportunityType.VACANCY]: 'Вакансия',
      [OpportunityType.INTERNSHIP]: 'Стажировка',
      [OpportunityType.MENTORSHIP]: 'Менторская программа',
      [OpportunityType.EVENT]: 'Мероприятие',
    };
    return map[type];
  }

  /* Человекопонятный формат работы */
  function formatWorkFormat(format: WorkFormat): string {
    const map: Record<WorkFormat, string> = {
      [WorkFormat.OFFICE]: '🏢 Офис',
      [WorkFormat.HYBRID]: '🔄 Гибрид',
      [WorkFormat.REMOTE]: '🏠 Удалённо',
    };
    return map[format];
  }

  /* Форматирование зарплаты */
  function formatSalary(): string {
    const { salaryMin, salaryMax } = opportunity!;

    if (salaryMin && salaryMax) {
      return `${salaryMin.toLocaleString('ru-RU')} – ${salaryMax.toLocaleString('ru-RU')} ₽`;
    }
    if (salaryMin) return `от ${salaryMin.toLocaleString('ru-RU')} ₽`;
    if (salaryMax) return `до ${salaryMax.toLocaleString('ru-RU')} ₽`;
    return 'По договорённости';
  }

  /* Форматирование даты */
  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Рендер
  return (
    <div className={styles.container}>

      {/* Кнопка "Назад" */}
      <button onClick={() => navigate(-1)} className={styles.backBtn}>
        ← Назад
      </button>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          {/* Бейдж типа */}
          <span className={styles.typeBadge}>{formatType(opportunity.type)}</span>

          <h1 className={styles.title}>{opportunity.title}</h1>

          {/* Компания */}
          <div className={styles.companyRow}>
            {opportunity.logoUrl && (
              <img
                src={opportunity.logoUrl}
                alt={opportunity.companyName}
                className={styles.companyLogo}
              />
            )}
            <div>
              <span className={styles.companyName}>{opportunity.companyName}</span>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          <button
            className={`${styles.favBtn} ${isFavorite(opportunity.id) ? styles.favBtnActive : ''}`}
            onClick={() => toggleFavorite(opportunity.id, 'OPPORTUNITY')}
            title={isFavorite(opportunity.id) ? 'Убрать из избранного' : 'В избранное'}
          >
            {isFavorite(opportunity.id) ? '★' : '☆'}
          </button>
          <span className={styles.salary}>{formatSalary()}</span>
        </div>
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Формат</span>
          <span className={styles.metaValue}>{formatWorkFormat(opportunity.workFormat)}</span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Город</span>
          <span className={styles.metaValue}>{opportunity.city}</span>
        </div>

        {opportunity.address && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Адрес</span>
            <span className={styles.metaValue}>{opportunity.address}</span>
          </div>
        )}

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Опубликовано</span>
          <span className={styles.metaValue}>{formatDate(opportunity.publishedAt)}</span>
        </div>

        {opportunity.expiresAt && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Действует до</span>
            <span className={styles.metaValue}>{formatDate(opportunity.expiresAt)}</span>
          </div>
        )}

        {opportunity.type === OpportunityType.EVENT && opportunity.eventDate && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Дата проведения</span>
            <span className={styles.metaValue}>{formatDate(opportunity.eventDate)}</span>
          </div>
        )}
      </div>

      {/* теги */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className={styles.tagsSection}>
            {opportunity.tags.map((tag, i) => (
              <span key={i} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        

      <div className={styles.descriptionSection}>
        <h2 className={styles.sectionTitle}>Описание</h2>
        <div className={styles.description}>
          {opportunity.description.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>

      {(opportunity.contactEmail || opportunity.contactPhone || opportunity.contactUrl) && (
        <div className={styles.contactsSection}>
          <h2 className={styles.sectionTitle}>Контакты</h2>
          <div className={styles.contactsList}>
            {opportunity.contactEmail && (
              <a href={`mailto:${opportunity.contactEmail}`} className={styles.contactLink}>
                ✉ {opportunity.contactEmail}
              </a>
            )}
            {opportunity.contactPhone && (
              <a href={`tel:${opportunity.contactPhone}`} className={styles.contactLink}>
                📞 {opportunity.contactPhone}
              </a>
            )}
            {opportunity.contactUrl && (
              <a
                href={opportunity.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactLink}
              >
                🔗 {opportunity.contactUrl}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Кнопка отклика (только для авторизованного соискателя) */}
      <div className={styles.actions}>
        {user && user.role === 'APPLICANT' ? (
          <button className={styles.btnPrimary}>
            Откликнуться
          </button>
        ) : !user ? (
          <p className={styles.loginHint}>
            Чтобы откликнуться, <button onClick={() => navigate('/')} className={styles.linkBtn}>войдите</button> как соискатель.
          </p>
        ) : null}
      </div>
    </div>
  );
}