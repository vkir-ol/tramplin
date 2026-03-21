// Страница личного кабинета Работодателя


import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCompanyProfile, updateCompanyProfile } from '../api/employer';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { CompanyProfileResponse, UpdateCompanyRequest } from '../types';
import styles from './Dashboard.module.css';

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

// Вспомогательная функция — текст баннера верификации
function getVerificationBanner(status: string): { icon: string; title: string; text: string } | null {
  switch (status) {
    case 'REJECTED':
      return {
        icon: '❌',
        title: 'Верификация отклонена',
        text: 'Проверьте данные компании и повторите попытку. Вы не можете создавать вакансии.',
      };
    case 'PENDING':
      return {
        icon: '⏳',
        title: 'Компания на проверке',
        text: 'Ваша компания проходит верификацию. До завершения проверки вы не сможете создавать вакансии.',
      };
    case 'UNVERIFIED':
      return {
        icon: '⏳',
        title: 'Требуется верификация',
        text: 'Заполните профиль компании и ИНН для прохождения верификации.',
      };
    default:
      return null;
  }
}

export function EmployerDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
            <span>{banner.icon}</span>
            <div>
              <strong>{banner.title}</strong>
              <p>{banner.text}</p>
            </div>
          </div>
        )}

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
                  label="Название компании *"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="ООО «КодИнсайт»"
                />
                <Input
                  label="ИНН"
                  value={form.inn || ''}
                  onChange={(e) => handleChange('inn', e.target.value)}
                  placeholder="123456789"
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

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>📝 Мои вакансии</h2>
            </div>
            <p className={styles.placeholder}>
              {isNotVerified
                ? 'Создание вакансий станет доступно после верификации'
                : 'Активные, закрытые и запланированные вакансии'}
            </p>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>👤 Отклики</h2>
            </div>
            <p className={styles.placeholder}>Список откликнувшихся соискателей</p>
          </section>
        </div>
      </div>
    </main>
  );
}