// Страница личного кабинета Работодателя


import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCompanyProfile, updateCompanyProfile } from '../api/employer';
import { getMyOpportunities, deleteOpportunity } from '../api/opportunities';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { CompanyProfileResponse, UpdateCompanyRequest, OpportunityResponse } from '../types';
import styles from './Dashboard.module.css';
import { getIncomingApplications, updateApplicationStatus } from '../api/applications';
import type { ApplicationResponse, } from '../types';
import { ApplicationStatus } from '../types';

const verificationLabels: Record<string, string> = {
  UNVERIFIED: 'Не подтверждена',
  PENDING: 'На проверке',
  VERIFIED: 'Верифицирована',
  REJECTED: 'Отклонена',
};

const verificationColors: Record<string, string> = {
  UNVERIFIED: '#6b7280',
  PENDING: '#d97706',
  VERIFIED: '#059669',
  REJECTED: '#dc2626',
};

const typeLabels: Record<string, string> = {
  VACANCY: 'Вакансия',
  INTERNSHIP: 'Стажировка',
  MENTORSHIP: 'Менторство',
  EVENT: 'Мероприятие',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ACTIVE: 'Активна',
  CLOSED: 'Закрыта',
  ON_MODERATION: 'На модерации',
};

const statusColors: Record<string, string> = {
  DRAFT: '#6b7280',
  ACTIVE: '#059669',
  CLOSED: '#dc2626',
  ON_MODERATION: '#d97706',
};

const workFormatLabels: Record<string, string> = {
  OFFICE: 'Офис',
  HYBRID: 'Гибрид',
  REMOTE: 'Удалённо',
};

// Вспомогательная функция — текст баннера верификации
function getVerificationBanner(status: string): { icon: string; title: string; text: string } | null {
  switch (status) {
    case 'REJECTED':
      return {
        icon: 'cancel',
        title: 'Верификация отклонена',
        text: 'Проверьте данные компании и повторите попытку. Вы не можете создавать вакансии.',
      };
    case 'PENDING':
      return {
        icon: 'hourglass_top',
        title: 'Компания на проверке',
        text: 'Ваша компания проходит верификацию. До завершения проверки вы не сможете создавать вакансии.',
      };
    case 'UNVERIFIED':
      return {
        icon: 'verified_user',
        title: 'Требуется верификация',
        text: 'Заполните профиль компании и ИНН для прохождения верификации.',
      };
    default:
      return null;
  }
}

export function EmployerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Вакансии работодателя
  const [opportunities, setOpportunities] = useState<OpportunityResponse[]>([]);
  const [oppsLoading, setOppsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Отклики
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateCompanyRequest>({
    companyName: '',
    description: '',
    industry: '',
    inn: '',
    websiteUrl: '',
    city: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCompanyProfile();
      setProfile(data);
      setForm({
        companyName: data.companyName || '',
        description: data.description || '',
        industry: data.industry || '',
        inn: data.inn || '',
        websiteUrl: data.websiteUrl || '',
        city: data.city || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOpportunities() {
    setOppsLoading(true);
    try {
      const data = await getMyOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Не удалось загрузить вакансии:', err);
    } finally {
      setOppsLoading(false);
    }
  }

  async function handleDeleteOpportunity(id: string) {
    if (!confirm('Удалить эту вакансию? Это действие необратимо.')) return;
    setDeletingId(id);
    try {
      await deleteOpportunity(id);
      setOpportunities(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  function formatSalary(min: number | null, max: number | null): string {
    if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₽`;
    if (min) return `от ${min.toLocaleString('ru-RU')} ₽`;
    if (max) return `до ${max.toLocaleString('ru-RU')} ₽`;
    return 'По договорённости';
  }

  function handleChange(field: keyof UpdateCompanyRequest, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!form.companyName.trim()) {
      setError('Название компании обязательно');
      return;
    }
    if (form.inn && !/^\d{10}(\d{2})?$/.test(form.inn)) {
      setError('ИНН должен содержать 10 или 12 цифр');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Некорректный формат email');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateCompanyProfile(form);
      setProfile(updated);
      setIsEditing(false);
      setSuccessMsg('Профиль компании сохранён');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setForm({
        companyName: profile.companyName || '',
        description: profile.description || '',
        industry: profile.industry || '',
        inn: profile.inn || '',
        websiteUrl: profile.websiteUrl || '',
        city: profile.city || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
    setIsEditing(false);
    setError(null);
  }


  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  async function loadApplications() {
    setAppsLoading(true);
    try {
      const data = await getIncomingApplications(0, 50, statusFilter);
      setApps(data.content || []);
    } catch (err) {
      console.error('Ошибка загрузки откликов:', err);
    } finally {
      setAppsLoading(false);
    }
  }

  async function handleStatusChange(appId: string, newStatus: ApplicationStatus) {
    setUpdatingAppId(appId);
    try {
      const updated = await updateApplicationStatus(appId, { status: newStatus });
      setApps(prev => prev.map(a => a.id === appId ? updated : a));
    } catch (err) {
      console.error('Ошибка смены статуса:', err);
    } finally {
      setUpdatingAppId(null);
    }
  }


  if (isLoading) {
    return (
      <main className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.loadingState}>Загрузка профиля компании...</div>
        </div>
      </main>
    );
  }

  

  const vStatus = profile?.verificationStatus || 'UNVERIFIED';
  const isNotVerified = vStatus !== 'VERIFIED';
  const banner = getVerificationBanner(vStatus);

  return (
    <main className={styles.dashboard}>
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Кабинет работодателя</h1>
          <span className={`${styles.roleBadge} ${styles.roleBadgeEmployer}`}>
            Работодатель
          </span>
        </header>

        {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {banner && (
          <div className={styles.warningBanner}>
            <span className="material-symbols-rounded">{banner.icon}</span>
            <div>
              <strong>{banner.title}</strong>
              <p>{banner.text}</p>
            </div>
          </div>
        )}

        {/* Профиль компании */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Профиль компании</h2>
            <div className={styles.cardActions}>
              <span
                className={styles.verificationBadge}
                style={{
                  color: verificationColors[vStatus],
                  borderColor: verificationColors[vStatus],
                }}
              >
                {verificationLabels[vStatus] || vStatus}
              </span>
              {!isEditing && (
                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  Редактировать
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className={styles.editForm}>
              <div className={styles.formRow}>
                <Input
                  label="Название компании "
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Сбербанк"
                />
                <Input
                  label="ИНН"
                  value={form.inn || ''}
                  onChange={(e) => handleChange('inn', e.target.value)}
                  placeholder="123456789012"
                />
                <Input
                  label="Сфера деятельности"
                  value={form.industry || ''}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="Разработка ПО"
                />
              </div>

              <div className={styles.formRow}>
                <Input
                  label="Город"
                  value={form.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Москва"
                />
                <Input
                  label="Адрес"
                  value={form.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="ул. Измайловская, д. 1"
                />
                <Input
                  label="Сайт"
                  value={form.websiteUrl || ''}
                  onChange={(e) => handleChange('websiteUrl', e.target.value)}
                  placeholder="https://sber.ru"
                />
              </div>

              <div className={styles.formRow2}>
                <Input
                  label="Телефон"
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+7 (495) 123-45-67"
                />
                <Input
                  label="Email компании"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="sber@mail.ru"
                />
              </div>

              <div className={styles.textareaGroup}>
                <label className={styles.textareaLabel}>Описание компании</label>
                <textarea
                  className={styles.textarea}
                  value={form.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Расскажите о компании, проектах..."
                  rows={5}
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
            <div className={styles.profileView}>
              <div className={styles.profileSummary}>
                <div className={`${styles.avatar} ${styles.avatarCompany}`}>
                  {(profile?.companyName || user?.displayName || '?').charAt(0).toUpperCase()}
                </div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>
                    {profile?.companyName || 'Название не указано'}
                  </p>
                  <p className={styles.profileEmail}>{user?.email}</p>
                </div>
              </div>

              <div className={styles.detailsGrid}>
                {profile?.industry && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Сфера</span>
                    <span className={styles.detailValue}>{profile.industry}</span>
                  </div>
                )}
                {profile?.inn && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>ИНН</span>
                    <span className={styles.detailValue}>{profile.inn}</span>
                  </div>
                )}
                {profile?.city && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Город</span>
                    <span className={styles.detailValue}>{profile.city}</span>
                  </div>
                )}
                {profile?.address && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Адрес</span>
                    <span className={styles.detailValue}>{profile.address}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Телефон</span>
                    <span className={styles.detailValue}>{profile.phone}</span>
                  </div>
                )}
                {profile?.email && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{profile.email}</span>
                  </div>
                )}
                {profile?.websiteUrl && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Сайт</span>
                    <a
                      href={profile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.detailLink}
                    >
                      {profile.websiteUrl}
                    </a>
                  </div>
                )}
                {profile?.description && (
                  <div className={`${styles.detailItem} ${styles.detailFull}`}>
                    <span className={styles.detailLabel}>Описание</span>
                    <span className={styles.detailValue}>{profile.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Мои возможности */}
        <section className={`${styles.card} ${styles.cardFull}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><span className="material-symbols-rounded">list_alt</span> Мои возможности</h2>
            {!isNotVerified && (
              <Button size="sm" onClick={() => navigate('/company/opportunities/new')}>
                + Создать
              </Button>
            )}
          </div>

          {isNotVerified ? (
            <p className={styles.placeholder}>
              Создание вакансий станет доступно после верификации компании.
            </p>
          ) : oppsLoading ? (
            <p className={styles.placeholder}>Загрузка вакансий...</p>
          ) : opportunities.length === 0 ? (
            <div className={styles.emptyState}>
              <p>У вас пока нет вакансий.</p>
              <Button size="sm" onClick={() => navigate('/company/opportunities/new')}>
                Создать первую
              </Button>
            </div>
          ) : (
            <div className={styles.opportunitiesList}>
              {opportunities.map(opp => (
                <div key={opp.id} className={styles.oppCard}>
                  <div className={styles.oppMain}>
                    <div className={styles.oppTop}>
                      <span
                        className={styles.oppStatus}
                        style={{ color: statusColors[opp.status] || '#6b7280' }}
                      >
                        {statusLabels[opp.status] || opp.status}
                      </span>
                      <span className={styles.oppType}>
                        {typeLabels[opp.type] || opp.type}
                      </span>
                    </div>
                    <h3
                      className={styles.oppTitle}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                    >
                      {opp.title}
                    </h3>
                    <div className={styles.oppMeta}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                          {opp.workFormat === 'OFFICE' ? 'apartment' : opp.workFormat === 'HYBRID' ? 'sync_alt' : 'home'}
                        </span>
                        {workFormatLabels[opp.workFormat] || opp.workFormat}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>location_on</span>
                        {opp.city}
                      </span>
                      <span>{formatSalary(opp.salaryMin, opp.salaryMax)}</span>
                    </div>
                  </div>
                  <div className={styles.oppActions}>
                    <button
                      className={styles.oppBtnEdit}
                      onClick={() => navigate(`/opportunities/${opp.id}`)}
                      title="Просмотр"
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>visibility</span>
                    </button>
                    <button
                      className={styles.oppBtnDelete}
                      onClick={() => handleDeleteOpportunity(opp.id)}
                      disabled={deletingId === opp.id}
                      title="Удалить"
                    >
                      {deletingId === opp.id
                        ? <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>hourglass_top</span>
                        : <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`${styles.card} ${styles.cardFull}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><span className="material-symbols-rounded">group</span> Отклики</h2>
            <select
              className={styles.filterSelect}
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value ? e.target.value as ApplicationStatus : undefined)}
            >
              <option value="">Все статусы</option>
              <option value="PENDING">Ожидание</option>
              <option value="REVIEWED">Просмотрен</option>
              <option value="ACCEPTED">Принят</option>
              <option value="REJECTED">Отклонён</option>
              <option value="RESERVED">В резерве</option>
            </select>
          </div>

          {appsLoading ? (
            <p className={styles.placeholder}>Загрузка откликов...</p>
          ) : apps.length === 0 ? (
            <p className={styles.placeholder}>
              {statusFilter ? 'Нет откликов с таким статусом' : 'Пока нет откликов на ваши вакансии'}
            </p>
          ) : (
            <div className={styles.appsTable}>
              {apps.map(app => (
                <div key={app.id} className={styles.appRowEmployer}>
                  <div className={styles.appInfo}>
                    <span className={styles.appTitle}>
                      {app.applicantFirstName} {app.applicantLastName}
                    </span>
                    <span className={styles.appCompany}>{app.applicantEmail}</span>
                    <span
                      className={styles.appOppLink}
                      onClick={() => navigate(`/opportunities/${app.opportunityId}`)}
                    >
                      {app.opportunityTitle}
                    </span>
                  </div>
                  {app.coverLetter && (
                    <p className={styles.appCoverLetter}>{app.coverLetter}</p>
                  )}
                  <div className={styles.appActions}>
                    <span className={styles.appDate}>
                      {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <select
                      className={styles.statusSelect}
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                      disabled={updatingAppId === app.id}
                    >
                      <option value="PENDING">Ожидание</option>
                      <option value="REVIEWED">Просмотрен</option>
                      <option value="ACCEPTED">Принят</option>
                      <option value="REJECTED">Отклонён</option>
                      <option value="RESERVED">В резерве</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
