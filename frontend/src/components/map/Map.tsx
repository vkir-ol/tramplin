import { useState, useCallback } from 'react';
import { YMaps, Map, Clusterer, Placemark } from '@pbe/react-yandex-maps';
import { getOpportunitiesForMap } from '../../api/opportunities';
import type { OpportunityMapCard } from '../../types';
import styles from './Map.module.css';

/*
  Компонент Яндекс карты с маркерами вакансий
  При клике на маркер — показывает модульную карточку.
*/

// Цвета маркеров по типу возможности (из плана 04)
const MARKER_PRESETS: Record<string, string> = {
  VACANCY: 'islands#blueCircleDotIcon',
  INTERNSHIP: 'islands#blueCircleDotIcon',
  EVENT: 'islands#greenCircleDotIcon',
  MENTORSHIP: 'islands#violetCircleDotIcon',
};

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
  if (min && max) return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₽`;
  if (min) return `от ${min.toLocaleString('ru-RU')} ₽`;
  if (max) return `до ${max.toLocaleString('ru-RU')} ₽`;
  return 'По договорённости';
}

// Формируем HTML для маркера (модульная карточка при клике на маркер)
function buildBalloonContent(opp: OpportunityMapCard): string {
  return `
    <div style="font-family:Manrope,sans-serif;min-width:240px;padding:4px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        ${opp.logoUrl
          ? `<img src="${opp.logoUrl}" alt="" style="width:32px;height:32px;border-radius:6px;object-fit:cover;" />`
          : `<div style="width:32px;height:32px;border-radius:6px;background:#e8f0fe;display:flex;align-items:center;justify-content:center;font-weight:700;color:#1a56db;font-size:14px;">${opp.companyName.charAt(0)}</div>`
        }
        <div>
          <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${opp.companyName}</div>
          <div style="font-size:11px;color:#6b6b6b;">${TYPE_LABELS[opp.type] || opp.type}</div>
        </div>
      </div>
      <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:6px;line-height:1.3;">${opp.title}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
        <span style="font-size:12px;color:#6b6b6b;">${FORMAT_LABELS[opp.workFormat] || opp.workFormat}</span>
        <span style="font-size:12px;color:#6b6b6b;">📍 ${opp.city}</span>
      </div>
      <div style="font-size:13px;font-weight:600;color:#E8622C;">${formatSalary(opp.salaryMin, opp.salaryMax)}</div>
      <a href="/opportunities/${opp.id}" style="display:inline-block;margin-top:10px;font-size:12px;color:#E8622C;text-decoration:none;font-weight:600;">Подробнее →</a>
    </div>
  `;
}

interface MapViewProps {
  onMarkersLoaded?: (count: number) => void;
}

export default function MapView({ onMarkersLoaded }: MapViewProps) {
  const [markers, setMarkers] = useState<OpportunityMapCard[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка маркеров при изменении видимой области карты
  const handleBoundsChange = useCallback(async (e: any) => {
    try {
      const map = e.get('target');
      const bounds = map.getBounds();
      // bounds = [[swLat, swLng], [neLat, neLng]]
      const swLat = bounds[0][0];
      const swLng = bounds[0][1];
      const neLat = bounds[1][0];
      const neLng = bounds[1][1];

      setLoading(true);
      const data = await getOpportunitiesForMap({ swLat, swLng, neLat, neLng });
      setMarkers(data);
      onMarkersLoaded?.(data.length);
    } catch (err) {
      console.error('Ошибка загрузки маркеров:', err);
    } finally {
      setLoading(false);
    }
  }, [onMarkersLoaded]);

  return (
    <div className={styles.mapContainer}>
      {loading && <div className={styles.mapLoader}>Загрузка маркеров...</div>}
      <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY || '', lang: 'ru_RU', load: 'package.full' }}>
        <Map
          defaultState={{
            center: [55.7558, 37.6176], // Москва
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl'],
          }}
          width="100%"
          height="100%"
          onBoundsChange={handleBoundsChange}
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
        >
          <Clusterer
            options={{
              preset: 'islands#invertedOrangeClusterIcons',
              groupByCoordinates: false,
              clusterDisableClickZoom: false,
              clusterBalloonContentLayout: 'cluster#balloonCarousel',
            }}
          >
            {markers.map(opp => (
              <Placemark
                key={opp.id}
                geometry={[opp.latitude!, opp.longitude!]}
                options={{
                  preset: MARKER_PRESETS[opp.type] || 'islands#blueCircleDotIcon',
                }}
                properties={{
                  balloonContentBody: buildBalloonContent(opp),
                  hintContent: opp.title,
                }}
              />
            ))}
          </Clusterer>
        </Map>
      </YMaps>
    </div>
  );
}