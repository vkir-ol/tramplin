import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getOpportunities } from '../api/opportunities';
import MapView from '../components/map/Map';
import type { OpportunityResponse, OpportunityFilters } from '../types';
import { OpportunityType, WorkFormat } from '../types';
import styles from './HomePage.module.css';


/*
  Два режима отображения: карта с маркерами и список
  Фильтры: тип, формат работы, город, зарплата.
*/

const TYPE_LABELS: Record<string, string> = {
  VACANCY: 'Вакансия',
  INTERNSHIP: 'Стажировка',
  MENTORSHIP: 'Менторство',
  EVENT: 'Мероприятие',
};

const FORMAT_LABELS: Record<string, string> = {
  OFFICE: '🏢 Офис',
  HYBRID: '🔄 Гибрид',
  REMOTE: '🏠 Удалённо',
};

function formatSalary(min: number | null, max: number | null): string {
  if (min && max) 
    return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₽`;
  if (min) 
    return `от ${min.toLocaleString('ru-RU')} ₽`;
  if (max) 
    return `до ${max.toLocaleString('ru-RU')} ₽`;
  return 'По договорённости';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

type ViewMode = 'map' | 'list';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Режим отображения: карта или список
  const [viewMode, setViewMode] = useState<ViewMode>('map');

  // Фильтры
  const [filters, setFilters] = useState<OpportunityFilters>({
    page: 0,
    size: 20,
  });

  // Данные ленты
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  // Счётчик маркеров на карте
  const [markerCount, setMarkerCount] = useState<number | null>(null);

  // Загрузка ленты при переключении на список или изменении фильтров
  useEffect(() => {
    if (viewMode === 'list') {
      loadList();
    }
  }, [viewMode, filters]);

  async function loadList() {
    setListLoading(true);
    try {
      const data = await getOpportunities(filters);
      if (Array.isArray(data)) {
        setOpportunities(data as unknown as OpportunityResponse[]);
        setTotalPages(1);
      } else {
        setOpportunities(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Ошибка загрузки вакансий:', err);
    } finally {
      setListLoading(false);
    }
  }

  function handleFilterChange(key: keyof OpportunityFilters, value: string) {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 0, // сброс страницы при смене фильтра
    }));
  }

  function handlePageChange(newPage: number) {
    setFilters(prev => ({ ...prev, page: newPage }));
  }

  function clearFilters() {
    setFilters({ page: 0, size: 20 });
  }

  const hasActiveFilters = !!(filters.type || filters.workFormat || filters.city || filters.salaryMin);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroBgOrb1} />
        <div className={styles.heroBgOrb2} />

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Построй карьеру{' '}
            <span className={styles.heroAccent}>с нуля</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Находи стажировки, вакансии и менторов в&nbsp;IT.
            Формируй профессиональную сеть ещё до&nbsp;первого трудоустройства.
          </p>

          {user && (
            <div className={styles.welcomeBadge}>
              <span>👋</span>
              <span>Добро пожаловать, <strong>{user.displayName || user.email}</strong>!</span>
            </div>
          )}
        </div>
      </section>

      {/* Панель управления */}
      <section className={styles.controlsSection}>
        <div className={styles.controlsContainer}>

          {/* Переключатель карта/список */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺 Карта
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 Список
            </button>
          </div>

          {/* Фильтры */}
          <div className={styles.filters}>
            <select
              className={styles.filterSelect}
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">Все типы</option>
              <option value={OpportunityType.VACANCY}>Вакансии</option>
              <option value={OpportunityType.INTERNSHIP}>Стажировки</option>
              <option value={OpportunityType.MENTORSHIP}>Менторство</option>
              <option value={OpportunityType.EVENT}>Мероприятия</option>
            </select>

            <select
              className={styles.filterSelect}
              value={filters.workFormat || ''}
              onChange={(e) => handleFilterChange('workFormat', e.target.value)}
            >
              <option value="">Любой формат</option>
              <option value={WorkFormat.OFFICE}>Офис</option>
              <option value={WorkFormat.HYBRID}>Гибрид</option>
              <option value={WorkFormat.REMOTE}>Удалённо</option>
            </select>

            <input
              type="text"
              className={styles.filterInput}
              placeholder="Город"
              value={filters.city || ''}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />

            <input
              type="number"
              className={styles.filterInput}
              placeholder="Зарплата от"
              value={filters.salaryMin || ''}
              onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
              min={0}
            />

            {hasActiveFilters && (
              <button className={styles.filterClear} onClick={clearFilters}>
                ✕ Сбросить
              </button>
            )}
          </div>

          {/* Счётчик */}
          {viewMode === 'map' && markerCount !== null && (
            <div className={styles.counter}>
              Найдено на карте: {markerCount}
            </div>
          )}
        </div>
      </section>

      {/* Контент либо Карты или списка */}
      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {viewMode === 'map' ? (
            /* Карта */
            <div className={styles.mapWrapper}>
              <MapView onMarkersLoaded={setMarkerCount} />
            </div>
          ) : (
            /* Список */
            <div className={styles.listWrapper}>
              {listLoading ? (
                <div className={styles.listLoading}>Загрузка вакансий...</div>
              ) : opportunities.length === 0 ? (
                <div className={styles.listEmpty}>
                  <p>Ничего не найдено</p>
                  {hasActiveFilters && (
                    <button className={styles.filterClear} onClick={clearFilters}>
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={styles.listGrid}>
                    {opportunities.map(opp => (
                      <div
                        key={opp.id}
                        className={styles.listCard}
                        onClick={() => navigate(`/opportunities/${opp.id}`)}
                      >
                        {/* Шапка карточки */}
                        <div className={styles.listCardTop}>
                          <span className={styles.listCardType}>
                            {TYPE_LABELS[opp.type] || opp.type}
                          </span>
                          <span className={styles.listCardFormat}>
                            {FORMAT_LABELS[opp.workFormat] || opp.workFormat}
                          </span>
                        </div>

                        {/* Название */}
                        <h3 className={styles.listCardTitle}>{opp.title}</h3>

                        {/* Компания */}
                        <div className={styles.listCardCompany}>
                          <div className={styles.listCardLogo}>
                            {opp.logoUrl
                              ? <img src={opp.logoUrl} alt="" />
                              : opp.companyName.charAt(0)
                            }
                          </div>
                          <span>{opp.companyName}</span>
                        </div>

                        {/* Город и зарплата */}
                        <div className={styles.listCardBottom}>
                          <span className={styles.listCardCity}>📍 {opp.city}</span>
                          <span className={styles.listCardSalary}>
                            {formatSalary(opp.salaryMin, opp.salaryMax)}
                          </span>
                        </div>

                        {/* Дата */}
                        {opp.publishedAt && (
                          <div className={styles.listCardDate}>
                            {formatDate(opp.publishedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        className={styles.pageBtn}
                        disabled={filters.page === 0}
                        onClick={() => handlePageChange((filters.page || 0) - 1)}
                      >
                        ← Назад
                      </button>
                      <span className={styles.pageInfo}>
                        Страница {(filters.page || 0) + 1} из {totalPages}
                      </span>
                      <button
                        className={styles.pageBtn}
                        disabled={(filters.page || 0) >= totalPages - 1}
                        onClick={() => handlePageChange((filters.page || 0) + 1)}
                      >
                        Вперёд →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}