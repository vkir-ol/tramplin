import { useAuth } from '../hooks/useAuth';
import styles from './HomePage.module.css';


export function HomePage() {
  const { user } = useAuth();

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
              <span>Добро пожаловать, <strong>{user.displayName}</strong>!</span>
            </div>
          )}
        </div>

        {/* Заглушка для будущей карты */}
        <div className={styles.mapPlaceholder}>
          <div className={styles.mapInner}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className={styles.mapIcon}
            >
              <path
                d="M24 4C16.268 4 10 10.268 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.732-6.268-14-14-14z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="24"
                cy="18"
                r="5"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
            <p className={styles.mapText}>
              Здесь будет интерактивная карта
              <br />
              <span className={styles.mapSubtext}>Yandex Maps API · вакансии и мероприятия</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
