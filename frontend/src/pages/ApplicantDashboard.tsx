// Страница личного кабинета соискателя

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApplicantProfile, updateApplicantProfile } from '../api/applicant';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { ApplicantProfileResponse, UpdateApplicantRequest } from '../types';
import styles from './Dashboard.module.css';
import { useFavorites } from '../hooks/useFavorites';
import { getOpportunityById } from '../api/opportunities';
import type { OpportunityResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../api/applications';
import type { ApplicationResponse } from '../types';



export function ApplicantDashboard() {
  const { user } = useAuth();

  // Состояния
  const [profile, setProfile] = useState<ApplicantProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();
  const [favOpportunities, setFavOpportunities] = useState<OpportunityResponse[]>([]);
  const [favsLoading, setFavsLoading] = useState(false);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Загрузка данных избранных вакансий
  useEffect(() => {
    async function loadFavorites() {
      const oppIds = favorites
        .filter(f => f.type === 'OPPORTUNITY')
        .map(f => f.id);
      if (oppIds.length === 0) {
        setFavOpportunities([]);
        return;
      }
      setFavsLoading(true);
      try {
        const results = await Promise.all(
          oppIds.map(id => getOpportunityById(id).catch(() => null))
        );
        setFavOpportunities(results.filter(Boolean) as OpportunityResponse[]);
      } catch (err) {
        console.error('Ошибка загрузки избранного:', err);
      } finally {
        setFavsLoading(false);
      }
    }
    loadFavorites();
  }, [favorites]);


  useEffect(() => {
    async function loadApplications() {
      setAppsLoading(true);
      try {
        const data = await getMyApplications(0, 50);
        setApplications(data.content || []);
      } catch (err) {
        console.error('Ошибка загрузки откликов:', err);
      } finally {
        setAppsLoading(false);
      }
    }
    loadApplications();
  }, []);

  // Данные формы редактирования
  const [form, setForm] = useState<UpdateApplicantRequest>({
    firstName: '',
    lastName: '',
    middleName: '',
    university: '',
    course: undefined,
    graduationYear: undefined,
    bio: '',
    phone: '',
  });

  // Загрузка профиля при монтировании
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getApplicantProfile();
      setProfile(data);
      // Заполняем форму текущими данными
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        middleName: data.middleName || '',
        university: data.university || '',
        course: data.course ?? undefined,
        graduationYear: data.graduationYear ?? undefined,
        bio: data.bio || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Обработка полей формы
  function handleChange(field: keyof UpdateApplicantRequest, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'course' || field === 'graduationYear'
        ? (value === '' ? undefined : Number(value))
        : value,
    }));
  }

  // Сохранение
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Клиентская валидация
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Имя и фамилия обязательны');
      return;
    }
    if (form.course !== undefined && (form.course < 1 || form.course > 6)) {
      setError('Курс должен быть от 1 до 6');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateApplicantProfile(form);
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg('Профиль сохранён');
      // скрыть сообщение черзе 3 секунды
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  // Отмена редактирования
  function handleCancel() {
    if (profile) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        university: profile.university || '',
        course: profile.course ?? undefined,
        graduationYear: profile.graduationYear ?? undefined,
        bio: profile.bio || '',
        phone: profile.phone || '',
      });
    }
    setIsEditing(false);
    setError(null);
  }

  // Индикатор загрузки
  if (isLoading) {
    return (
      <main className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.loadingState}>Загрузка профиля...</div>
        </div>
      </main>
    );
  }

  // Полное имя для отображения
  const fullName = profile
    ? [profile.lastName, profile.firstName, profile.middleName].filter(Boolean).join(' ')
    : user?.displayName || '';


  const statusLabels: Record<string, string> = {
    PENDING: 'Ожидание',
    REVIEWED: 'Просмотрен',
    ACCEPTED: 'Принят',
    REJECTED: 'Отклонён',
    RESERVED: 'В резерве',
  };

  const statusColors: Record<string, string> = {
    PENDING: '#d97706',
    REVIEWED: '#2563eb',
    ACCEPTED: '#059669',
    REJECTED: '#dc2626',
    RESERVED: '#6b7280',
  };



  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Личный кабинет</h1>
          <span className={styles.roleBadge}>Соискатель</span>
        </header>

        {/* Сообщения */}
        {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Карточка профиля */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Мой профиль</h2>
            {!isEditing && (
              <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}
          </div>

          {isEditing ? (
            /* Режим редактирования */
            <form onSubmit={handleSave} className={styles.editForm}>
              <div className={styles.formRow}>
                <Input
                  label="Фамилия *"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Киреев"
                />
                <Input
                  label="Имя *"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Влад"
                />
                <Input
                  label="Отчество"
                  value={form.middleName || ''}
                  onChange={(e) => handleChange('middleName', e.target.value)}
                  placeholder="Алексеевич"
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="ВУЗ"
                  value={form.university || ''}
                  onChange={(e) => handleChange('university', e.target.value)}
                  placeholder="МГТУ им. Н.Э Баумана"
                />
                <Input
                  label="Курс (1-6)"
                  type="number"
                  value={form.course?.toString() || ''}
                  onChange={(e) => handleChange('course', e.target.value)}
                  placeholder="1"
                />
                <Input
                  label="Год выпуска"
                  type="number"
                  value={form.graduationYear?.toString() || ''}
                  onChange={(e) => handleChange('graduationYear', e.target.value)}
                  placeholder="2026"
                />
              </div>

              <Input
                label="Телефон"
                type="tel"
                value={form.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (901) 243-35-39"
              />

              <div className={styles.textareaGroup}>
                <label className={styles.textareaLabel}>О себе</label>
                <textarea
                  className={styles.textarea}
                  value={form.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Расскажите о себе, о своих навыках и целях..."
                  rows={4}
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" isLoading={isSaving}>
                  Сохранить
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Отмена
                </Button>
              </div>
            </form>
          ) : (
            /* Режим просмотра */
            <div className={styles.profileView}>
              <div className={styles.profileSummary}>
                <div className={styles.avatar}>
                  {(profile?.firstName || user?.displayName || '?').charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>
                    {fullName || 'Имя не указано'}
                  </p>
                  <p className={styles.profileEmail}>{user?.email}</p>
                </div>
              </div>

              <div className={styles.detailsGrid}>
                {profile?.university && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ВУЗ</span>
                    <span className={styles.detailValue}>{profile.university}</span>
                  </div>
                )}
                {profile?.course && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Курс</span>
                    <span className={styles.detailValue}>{profile.course}</span>
                  </div>
                )}
                {profile?.graduationYear && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Год выпуска</span>
                    <span className={styles.detailValue}>{profile.graduationYear}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Телефон</span>
                    <span className={styles.detailValue}>{profile.phone}</span>
                  </div>
                )}
                {profile?.bio && (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabel}>О себе</span>
                    <span className={styles.detailValue}>{profile.bio}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className="material-symbols-rounded">patient_list</span> Мои отклики</h2>
            </div>
            {appsLoading ? (
              <p className={styles.placeholder}>Загрузка...</p>
            ) : applications.length === 0 ? (
              <p className={styles.placeholder}>У вас пока нет откликов</p>
            ) : (
              <div className={styles.appsTable}>
                {applications.map(app => (
                  <div key={app.id} className={styles.appRow}>
                    <div className={styles.appInfo}>
                      <span
                        className={styles.appTitle}
                        onClick={() => navigate(`/opportunities/${app.opportunityId}`)}
                      >
                        {app.opportunityTitle}
                      </span>
                      <span className={styles.appCompany}>{app.companyName}</span>
                    </div>
                    <div className={styles.appMeta}>
                      <span
                        className={styles.appStatus}
                        style={{
                          color: statusColors[app.status] || '#6b7280',
                          borderColor: statusColors[app.status] || '#6b7280',
                        }}
                      >
                        {statusLabels[app.status] || app.status}
                      </span>
                      <span className={styles.appDate}>
                        {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className="material-symbols-rounded">bookmarks</span> Избранное</h2>
            </div>
            {favsLoading ? (
              <p className={styles.placeholder}>Загрузка...</p>
            ) : favOpportunities.length === 0 ? (
              <p className={styles.placeholder}>Нет сохранённых вакансий</p>
            ) : (
              <div className={styles.favList}>
                {favOpportunities.map(opp => (
                  <div key={opp.id} className={styles.favItem}>
                    <div
                      className={styles.favInfo}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      <span className={styles.favTitle}>{opp.title}</span>
                      <span className={styles.favCompany}>{opp.companyName} · {opp.city}</span>
                    </div>
                    <button
                      className={styles.favRemove}
                      onClick={() => removeFavorite(opp.id)}
                      title="Убрать из избранного"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}><span className="material-symbols-rounded">group</span> Контакты</h2>
            </div>
            <p className={styles.placeholder}>Профессиональные контакты и нетворкинг</p>
          </section>
        </div>
      </div>
    </main>
  );
}