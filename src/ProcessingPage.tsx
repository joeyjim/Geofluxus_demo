import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHashtag,
  faBuilding,
  faHouse,
  faChartBar,
  faArrowRight,
  faChevronDown,
  faTriangleExclamation,
  faRotate,
  faGripLines,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

// ── Data ──────────────────────────────────────────────────────

const COLORS = {
  hergebruiken: '#1b5e20',
  recycling:    '#43a047',
  terugwinning: '#fb8c00',
  verwijderen:  '#e53935',
  onbekend:     '#9e9e9e',
} as const;

type MethodKey = keyof typeof COLORS;

const METHODS: { key: MethodKey; label: string; code: string; color: string }[] = [
  { key: 'hergebruiken', label: 'Hergebruiken', code: 'A', color: COLORS.hergebruiken },
  { key: 'recycling',    label: 'Recycling',    code: 'B', color: COLORS.recycling    },
  { key: 'terugwinning', label: 'Terugwinning', code: 'C', color: COLORS.terugwinning },
  { key: 'verwijderen',  label: 'Verwijderen',  code: 'D', color: COLORS.verwijderen  },
  { key: 'onbekend',     label: 'Onbekend',     code: 'O', color: COLORS.onbekend     },
];

type Distribution = Record<MethodKey, number>;

const OVERVIEW: Distribution = {
  hergebruiken: 1525.70,
  recycling:    1476.48,
  terugwinning: 1525.70,
  verwijderen:   295.30,
  onbekend:       98.43,
};
const OVERVIEW_TOTAL = Object.values(OVERVIEW).reduce((s, v) => s + v, 0);

type Category = 'Bovengemiddeld' | 'Gemiddeld' | 'Ondergemiddeld' | 'Onbekende verwerking';

interface WasteCardData {
  id: number;
  category: Category;
  isDangerous: boolean;
  title: string;
  wasteCode: string;
  materials: string;
  processor: string;
  total: number;
  yourProcessing: Distribution;
  national: Distribution;
}

const CARDS: WasteCardData[] = [
  {
    id: 1, category: 'Bovengemiddeld', isDangerous: true,
    title: 'Afval van verf en lak dat organische oplosmiddelen of andere gevaarlijke stoffen bevat',
    wasteCode: '0801111', materials: 'Frees, Brokken, Asfalt, Niet onder 170301..., +10', processor: 'Renewi',
    total: 3.72,
    yourProcessing: { hergebruiken: 3.72, recycling: 0,    terugwinning: 0,    verwijderen: 0, onbekend: 0    },
    national:       { hergebruiken: 0.75, recycling: 0.10, terugwinning: 0.08, verwijderen: 0.05, onbekend: 0.02 },
  },
  {
    id: 2, category: 'Gemiddeld', isDangerous: true,
    title: 'Afval van verf en lak dat organische oplosmiddelen of andere gevaarlijke stoffen bevat',
    wasteCode: '0801111', materials: 'Frees, Brokken, Asfalt, Niet onder 170301..., +10', processor: 'Renewi',
    total: 3.72,
    yourProcessing: { hergebruiken: 0, recycling: 3,    terugwinning: 0.72, verwijderen: 0,  onbekend: 0    },
    national:       { hergebruiken: 0.15, recycling: 0.45, terugwinning: 0.25, verwijderen: 0.10, onbekend: 0.05 },
  },
  {
    id: 3, category: 'Ondergemiddeld', isDangerous: true,
    title: 'Afval van verf en lak dat organische oplosmiddelen of andere gevaarlijke stoffen bevat',
    wasteCode: '0801111', materials: 'Frees, Brokken, Asfalt, Niet onder 170301..., +10', processor: 'Renewi',
    total: 3.72,
    yourProcessing: { hergebruiken: 0, recycling: 0.72, terugwinning: 0, verwijderen: 3,    onbekend: 0    },
    national:       { hergebruiken: 0.05, recycling: 0.20, terugwinning: 0.15, verwijderen: 0.55, onbekend: 0.05 },
  },
  {
    id: 4, category: 'Onbekende verwerking', isDangerous: true,
    title: 'Afval van verf en lak dat organische oplosmiddelen of andere gevaarlijke stoffen bevat',
    wasteCode: '0801111', materials: 'Frees, Brokken, Asfalt, Niet onder 170301..., +10', processor: 'Renewi',
    total: 3.72,
    yourProcessing: { hergebruiken: 0, recycling: 0, terugwinning: 0, verwijderen: 0, onbekend: 3.72 },
    national:       { hergebruiken: 0.10, recycling: 0.10, terugwinning: 0.10, verwijderen: 0.10, onbekend: 0.60 },
  },
];

const BADGE: Record<Category, { bg: string; color: string; border: string }> = {
  'Bovengemiddeld':       { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  'Gemiddeld':            { bg: '#fff8e1', color: '#e65100', border: '#ffcc80' },
  'Ondergemiddeld':       { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  'Onbekende verwerking': { bg: '#f5f5f5', color: '#616161', border: '#bdbdbd' },
};

const TABS = [
  { key: 'all',   label: 'Toon alles'       },
  { key: 'below', label: 'Ondergemiddeld (3)' },
  { key: 'avg',   label: 'Gemiddeld (8)'     },
  { key: 'above', label: 'Bovengemiddeld (4)' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Helpers ───────────────────────────────────────────────────

const toNl = (n: number): string =>
  n === 0 ? '0' : n.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ── Sub-components ────────────────────────────────────────────

function MethodRow({
  label, color, value, maxValue, showValue,
}: {
  label: string; color: string; value: number; maxValue: number; showValue: boolean;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="proc-method-row">
      <span className="proc-method-dot" style={{ background: color }} />
      <span className="proc-method-label">{label}</span>
      <div className="proc-bar-track">
        {pct > 0 && (
          <div className="proc-bar-fill" style={{ width: `${pct}%`, background: color }} />
        )}
      </div>
      {showValue && <span className="proc-method-value">{toNl(value)} t</span>}
    </div>
  );
}

function WasteCard({ card }: { card: WasteCardData }) {
  const maxNational = Math.max(...Object.values(card.national));
  const badge = BADGE[card.category];

  return (
    <div className="waste-card">
      {/* Left: info */}
      <div className="waste-card-info">
        <div className="waste-card-tags">
          <span className="waste-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
            {card.category}
          </span>
          {card.isDangerous && (
            <span className="waste-dangerous">
              <FontAwesomeIcon icon={faTriangleExclamation} /> Gevaarlijk
            </span>
          )}
        </div>

        <p className="waste-card-title">{card.title}</p>

        <div className="waste-card-meta">
          <div className="waste-meta-row">
            <FontAwesomeIcon icon={faHashtag} className="waste-meta-icon" />
            <span>{card.wasteCode}</span>
          </div>
          <div className="waste-meta-row">
            <FontAwesomeIcon icon={faGripLines} className="waste-meta-icon" />
            <span className="waste-meta-text">{card.materials}</span>
          </div>
          <div className="waste-meta-row">
            <FontAwesomeIcon icon={faBuilding} className="waste-meta-icon" />
            <span>{card.processor}</span>
          </div>
        </div>

        <a className="waste-card-link">
          Bekijk details <FontAwesomeIcon icon={faArrowRight} />
        </a>
      </div>

      {/* Right: charts */}
      <div className="waste-card-charts">
        {/* Uw verwerking */}
        <div className="waste-proc-col">
          <div className="waste-proc-header">
            <FontAwesomeIcon icon={faHouse} className="waste-proc-icon" />
            <span className="waste-proc-label">Uw verwerking</span>
            <span className="waste-proc-total">{toNl(card.total)} t</span>
          </div>
          {METHODS.map(m => (
            <MethodRow
              key={m.key}
              label={m.label}
              color={m.color}
              value={card.yourProcessing[m.key]}
              maxValue={card.total}
              showValue
            />
          ))}
        </div>

        <div className="waste-col-divider" />

        {/* Landelijke verdeling */}
        <div className="waste-proc-col">
          <div className="waste-proc-header">
            <FontAwesomeIcon icon={faChartBar} className="waste-proc-icon" />
            <span className="waste-proc-label">Landelijke verdeling</span>
          </div>
          {METHODS.map(m => (
            <MethodRow
              key={m.key}
              label={m.label}
              color={m.color}
              value={card.national[m.key]}
              maxValue={maxNational}
              showValue={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function ProcessingPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filteredCards = CARDS.filter(c => {
    if (activeTab === 'all')   return true;
    if (activeTab === 'below') return c.category === 'Ondergemiddeld';
    if (activeTab === 'avg')   return c.category === 'Gemiddeld';
    if (activeTab === 'above') return c.category === 'Bovengemiddeld';
    return true;
  });

  return (
    <div className="proc-page">
      {/* Title */}
      <h1 className="proc-title">Verwerkingsmethoden</h1>

      {/* Filter bar */}
      <div className="proc-filter-bar">
        <span className="proc-filter-label">Filters</span>
        <button className="proc-filter-btn">Department <FontAwesomeIcon icon={faChevronDown} /></button>
        <button className="proc-filter-btn">Project <FontAwesomeIcon icon={faChevronDown} /></button>
        <span className="proc-date-chip">
          01-01-2021 · 31-12-2021
          <FontAwesomeIcon icon={faXmark} className="proc-chip-x" />
        </span>
        <button className="proc-collapse-btn"><FontAwesomeIcon icon={faChevronDown} /></button>
        <div className="proc-filter-right">
          <button className="proc-toon-meer-btn">
            <FontAwesomeIcon icon={faChevronDown} /> Toon meer
          </button>
          <button className="proc-refresh-btn">
            <FontAwesomeIcon icon={faRotate} />
          </button>
        </div>
      </div>

      {/* Overzicht */}
      <section className="proc-section">
        <h2 className="proc-section-title">Overzicht</h2>
        <div className="proc-overview-card">
          <div className="proc-overview-header">
            <span className="proc-overview-label">Gebruikte verwerkingsmethodes</span>
            <span className="proc-overview-total">
              {OVERVIEW_TOTAL.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t
            </span>
          </div>

          <div className="proc-stacked-bar">
            {METHODS.map(m => (
              <div
                key={m.key}
                className="proc-stacked-segment"
                style={{ flex: OVERVIEW[m.key] / OVERVIEW_TOTAL, background: m.color }}
                title={`${m.label}: ${toNl(OVERVIEW[m.key])} t`}
              />
            ))}
          </div>

          <div className="proc-overview-legend">
            {METHODS.map(m => (
              <span key={m.key} className="proc-legend-item">
                <span className="proc-legend-dot" style={{ background: m.color }} />
                <span className="proc-legend-code">{m.code}</span>
                {m.label}
              </span>
            ))}
          </div>

          <button className="proc-toon-meer-link">
            Toon meer <FontAwesomeIcon icon={faChevronDown} />
          </button>
        </div>
      </section>

      {/* Per afvalstroom */}
      <section className="proc-section">
        <div className="proc-streams-header">
          <h2 className="proc-section-title">Per afvalstroom</h2>
          <div className="proc-tabs">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`proc-tab${activeTab === tab.key ? ' proc-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="proc-cards">
          {filteredCards.map(card => <WasteCard key={card.id} card={card} />)}
        </div>
      </section>
    </div>
  );
}
