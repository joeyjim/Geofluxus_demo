import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faLocationDot,
  faBuilding,
  faBoxesStacked,
  faTruck,
  faGear,
  faDatabase,
  faTriangleExclamation,
  faCircleCheck,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons';
import type { FlowEntry, ProcessingMethodKey } from './Map';

// ── Risk engine ───────────────────────────────────────────────

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskResult {
  level: RiskLevel;
  score: number;
  factors: string[];
  actions: string[];
}

const METHOD_LABELS: Record<ProcessingMethodKey, string> = {
  hergebruiken: 'Hergebruiken (A)',
  recycling:    'Recycling (B)',
  terugwinning: 'Terugwinning (C)',
  verwijderen:  'Verwijderen (D)',
  onbekend:     'Onbekend (O)',
};

export function computeRisk(flow: FlowEntry): RiskResult {
  let score = 0;
  const factors: string[] = [];
  const actions: string[] = [];

  if (flow.distance > 200) {
    score += 3;
    factors.push(`Very long transport distance (${flow.distance} km)`);
    actions.push('Evaluate closer certified processors to reduce transport risk and CO₂ emissions');
  } else if (flow.distance > 100) {
    score += 2;
    factors.push(`Elevated transport distance (${flow.distance} km)`);
  } else if (flow.distance > 50) {
    score += 1;
  }

  if (flow.isDangerous) {
    score += 3;
    factors.push('Classified as hazardous material');
    actions.push('Verify handling and transport complies with EVOA/ADR regulations');
  }

  const methodScore: Record<ProcessingMethodKey, number> = {
    hergebruiken: -1,
    recycling:     0,
    terugwinning:  1,
    verwijderen:   3,
    onbekend:      2,
  };
  const ms = methodScore[flow.processingMethod];
  score += Math.max(0, ms);

  if (flow.processingMethod === 'verwijderen') {
    factors.push('Disposal method used — lowest position in waste hierarchy');
    actions.push('Investigate upgrade to recycling or reuse pathway');
  } else if (flow.processingMethod === 'onbekend') {
    factors.push('Processing method unknown or unverified');
    actions.push('Request processing certificate from processor to confirm method');
  } else if (flow.processingMethod === 'terugwinning') {
    factors.push('Energy recovery applied instead of material reuse');
  }

  if (flow.tonnage > 150) {
    score += 2;
    factors.push(`High volume stream (${flow.tonnage} t)`);
  } else if (flow.tonnage > 100) {
    score += 1;
  }

  if (flow.count >= 10) {
    score += 1;
    factors.push(`High number of transport trips (${flow.count})`);
    actions.push('Consider consolidating freight trips to reduce logistics exposure');
  }

  const level: RiskLevel = score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
  return { level, score, factors, actions };
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  flow: FlowEntry;
  onClose: () => void;
}

const RISK_STYLE: Record<RiskLevel, { bg: string; color: string; border: string; label: string }> = {
  HIGH:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', label: 'High Risk'   },
  MEDIUM: { bg: '#fef3c7', color: '#d97706', border: '#fcd34d', label: 'Medium Risk' },
  LOW:    { bg: '#dcfce7', color: '#16a34a', border: '#86efac', label: 'Low Risk'    },
};

export default function StreamDetailPanel({ flow, onClose }: Props) {
  const risk = computeRisk(flow);
  const rs = RISK_STYLE[risk.level];

  return (
    <div className="stream-detail-panel">
      {/* Header */}
      <div className="detail-header">
        <span className="stream-dot" style={{ background: flow.color, width: 12, height: 12 }} />
        <span className="detail-material">{flow.material}</span>
        <button className="detail-close-btn" onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Risk badge */}
      <div
        className="detail-risk-badge"
        style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}
      >
        <FontAwesomeIcon icon={risk.level === 'LOW' ? faCircleCheck : faTriangleExclamation} />
        <span className="detail-risk-label">{rs.label}</span>
        <span className="detail-risk-score">score {risk.score}/10</span>
      </div>

      {/* 6 questions */}
      <div className="detail-questions">
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faLocationDot} className="detail-q-icon" />
          <span className="detail-q-label">Where from?</span>
          <span className="detail-q-value">{flow.from}</span>
        </div>
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faBuilding} className="detail-q-icon" />
          <span className="detail-q-label">Who processes?</span>
          <span className="detail-q-value">{flow.to}</span>
          <span className="detail-q-sub">{flow.processorType}</span>
        </div>
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faBoxesStacked} className="detail-q-icon" />
          <span className="detail-q-label">What's in it?</span>
          <span className="detail-q-value">
            {flow.composition.join(' · ')}
            {flow.isDangerous && (
              <span className="detail-dangerous-tag">
                <FontAwesomeIcon icon={faTriangleExclamation} /> Hazardous
              </span>
            )}
          </span>
          <span className="detail-q-sub">
            <FontAwesomeIcon icon={faHashtag} style={{ fontSize: '0.7rem' }} /> EWC {flow.wasteCode}
          </span>
        </div>
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faTruck} className="detail-q-icon" />
          <span className="detail-q-label">Transport?</span>
          <span className="detail-q-value">{flow.distance} km &nbsp;·&nbsp; {flow.count} freights &nbsp;·&nbsp; {flow.tonnage} t</span>
        </div>
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faGear} className="detail-q-icon" />
          <span className="detail-q-label">How processed?</span>
          <span className="detail-q-value">{METHOD_LABELS[flow.processingMethod]}</span>
        </div>
        <div className="detail-q-row">
          <FontAwesomeIcon icon={faDatabase} className="detail-q-icon" />
          <span className="detail-q-label">Data basis?</span>
          <span className="detail-q-value">{flow.dataSource}</span>
        </div>
      </div>

      {/* Risk factors */}
      {risk.factors.length > 0 && (
        <section className="detail-section">
          <h4 className="detail-section-title">Risk factors</h4>
          <ul className="detail-factor-list">
            {risk.factors.map(f => (
              <li key={f} className="detail-factor-item">
                <span className="detail-factor-dot" style={{ background: rs.color }} />
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended actions */}
      {risk.actions.length > 0 && (
        <section className="detail-section">
          <h4 className="detail-section-title">Recommended actions</h4>
          <ul className="detail-action-list">
            {risk.actions.map(a => (
              <li key={a} className="detail-action-item">{a}</li>
            ))}
          </ul>
        </section>
      )}

      {risk.actions.length === 0 && (
        <section className="detail-section">
          <p className="detail-low-msg">
            This stream is performing well. No immediate action required.
          </p>
        </section>
      )}
    </div>
  );
}
