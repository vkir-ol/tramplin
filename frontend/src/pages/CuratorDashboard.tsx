// Страница личного кабинета Куратора


import { useAuth } from '../hooks/useAuth';
import styles from './Dashboard.module.css';

export function CuratorDashboard() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Панель управления</h1>
          <span className={`${styles.roleBadge} ${styles.roleBadgeCurator}`}>
            {isAdmin ? 'Администратор' : 'Куратор'}
          </span>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>✅ Верификация компаний</h2>
            </div>
            <p className={styles.placeholder}>Заявки на верификацию от работодателей</p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🛡️ Модерация</h2>
            </div>
            <p className={styles.placeholder}>Очередь модерации карточек и профилей</p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>🏷️ Управление тегами</h2>
            </div>
            <p className={styles.placeholder}>Справочник тегов, синонимы, иерархия</p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>📜 Журнал действий</h2>
            </div>
            <p className={styles.placeholder}>Audit log: кто, что, когда изменил</p>
          </section>

          {/* Только администратор может создавать кураторов */}
          {isAdmin && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>👤 Управление кураторами</h2>
              </div>
              <p className={styles.placeholder}>Создание учётных записей кураторов</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}