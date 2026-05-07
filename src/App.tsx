import { useState, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faBullseye,
  faGauge,
  faGear,
  faPuzzlePiece,
  faUpload,
  faFolderOpen,
  faCircleInfo,
  faPlus,
  faMinus,
  faRotate,
  faCamera,
  faEarthAmericas,
  faTruck,
  faCloud,
  faBoxesStacked,
  faArrowsLeftRight,
  faFilter,
  faGlobe,
  faUser,
  faLocationDot,
  faLeaf,
  faXmark,
  faUpDownLeftRight,
  faPalette,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import {
  faFile,
  faMap,
} from '@fortawesome/free-regular-svg-icons';
import Map, { FLOW_ENTRIES, getArcMidpoint, type FlowEntry } from './Map';
import ProcessingPage from './ProcessingPage';
import StreamDetailPanel, { computeRisk } from './StreamDetailPanel';

type PageKey = 'map' | 'processing';

const sidebarItems: { label: string; icon: any; section: string; page?: PageKey }[] = [
  { label: 'Home',               icon: faHome,        section: 'PRIMARY' },
  { label: 'Goals',              icon: faBullseye,    section: 'EVALUATE' },
  { label: 'Reporting',          icon: faFile,        section: 'EVALUATE' },
  { label: 'Dashboard',          icon: faGauge,       section: 'ANALYZE' },
  { label: 'Map',                icon: faMap,         section: 'ANALYZE', page: 'map' },
  { label: 'Processing',         icon: faGear,        section: 'ANALYZE', page: 'processing' },
  { label: 'Explore processors', icon: faPuzzlePiece, section: 'OPTIMIZE' },
];

const manageItems = [
  { label: 'Import',  icon: faUpload },
  { label: 'Dataset', icon: faFolderOpen },
];

const filterChips = [
  { label: 'Country A',   icon: faGlobe,       removable: false },
  { label: 'Disposer A',  icon: faUser,        removable: false },
  { label: 'Location A',  icon: faLocationDot, removable: true  },
  { label: '5 materials', icon: faLeaf,        removable: true  },
];

const TOTALS = { distance: 2912, freights: 26218, co2: 1334, streams: 632 };

const largestStreams  = [...FLOW_ENTRIES].sort((a, b) => b.tonnage  - a.tonnage ).slice(0, 5);
const longestDistance = [...FLOW_ENTRIES].sort((a, b) => b.distance - a.distance).slice(0, 5);

function App() {
  const [activePage,       setActivePage]       = useState<PageKey>('map');
  const [mapRef,           setMapRef]           = useState<LeafletMap | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedFlow,     setSelectedFlow]     = useState<FlowEntry | null>(null);

  const handleMapReady = useCallback((m: LeafletMap) => setMapRef(m), []);

  const handleFlowClick = useCallback((flow: FlowEntry) => {
    const isToggleOff = selectedFlow?.material === flow.material;
    setSelectedMaterial(isToggleOff ? null : flow.material);
    setSelectedFlow(isToggleOff ? null : flow);
  }, [selectedFlow]);

  const handleMapClick = useCallback(() => {
    setSelectedMaterial(null);
    setSelectedFlow(null);
  }, []);

  const handleLegendClick = useCallback((material: string) => {
    const next = selectedMaterial === material ? null : material;
    setSelectedMaterial(next);

    if (!next) {
      setSelectedFlow(null);
      return;
    }

    const flow = FLOW_ENTRIES.find(f => f.material === material);
    setSelectedFlow(flow ?? null);

    if (mapRef) {
      const mid = getArcMidpoint(material);
      if (mid) mapRef.panTo(mid as [number, number]);
    }
  }, [selectedMaterial, mapRef]);

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">g</div>
          <div className="brand-copy">
            <span className="brand-title">geoFluxus</span>
          </div>
        </div>

        {(['PRIMARY', 'EVALUATE', 'ANALYZE', 'OPTIMIZE'] as const).map(section => (
          <div key={section} className="sidebar-group">
            {section !== 'PRIMARY' && (
              <div className="sidebar-heading">{section.charAt(0) + section.slice(1).toLowerCase()}</div>
            )}
            {sidebarItems
              .filter(item => item.section === section)
              .map(item => (
                <button
                  key={item.label}
                  className={`nav-item${item.page === activePage ? ' active' : ''}`}
                  onClick={() => item.page && setActivePage(item.page)}
                >
                  <span className="nav-icon"><FontAwesomeIcon icon={item.icon} /></span>
                  {item.label}
                </button>
              ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="manage-heading">Manage</div>
          <div className="manage-list">
            {manageItems.map(item => (
              <button key={item.label} className="manage-item">
                <span className="nav-icon"><FontAwesomeIcon icon={item.icon} /></span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="support-card">
            <div className="support-label">Need help?</div>
            <div className="support-copy">Our team is ready to help you achieve your goals.</div>
            <button className="support-action">Ask us →</button>
          </div>
          <div className="user-card">
            <div className="user-avatar">TW</div>
            <div className="user-name">Name Lastname</div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={`main-view${activePage === 'processing' ? ' main-view--scroll' : ''}`}>
        {activePage === 'processing' ? (
          <ProcessingPage />
        ) : (
          <>
            <div className="page-header">
              <div className="page-title">Map</div>
              <div className="filter-bar">
                <div className="filter-row">
                  <button className="filter-action">
                    <FontAwesomeIcon icon={faFilter} />
                    Add filters
                  </button>
                  <div className="chips-row">
                    {filterChips.map(chip => (
                      <span key={chip.label} className="filter-chip">
                        <FontAwesomeIcon icon={chip.icon} className="chip-icon" />
                        {chip.label}
                        {chip.removable && <FontAwesomeIcon icon={faXmark} className="chip-remove" />}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="clear-button">Clear filters</button>
              </div>
            </div>

            <section className="map-section">
              <div className="map-shell">
                <Map
                  onMapReady={handleMapReady}
                  selectedMaterial={selectedMaterial}
                  onFlowClick={handleFlowClick}
                  onMapClick={handleMapClick}
                />

                {/* Top-left branding */}
                <div className="map-overlay mapbranding">
                  <div className="mapbox-logo">mapbox</div>
                  <FontAwesomeIcon icon={faEarthAmericas} />
                </div>

                {/* Left-side controls */}
                <div className="map-controls">
                  <button aria-label="information"><FontAwesomeIcon icon={faCircleInfo} /></button>
                  <button aria-label="zoom in"    onClick={() => mapRef?.zoomIn()}><FontAwesomeIcon icon={faPlus} /></button>
                  <button aria-label="zoom out"   onClick={() => mapRef?.zoomOut()}><FontAwesomeIcon icon={faMinus} /></button>
                  <button aria-label="pan"        onClick={() => mapRef?.setView([51.8, 5.0], 7)}><FontAwesomeIcon icon={faUpDownLeftRight} /></button>
                  <button aria-label="rotate">    <FontAwesomeIcon icon={faRotate} /></button>
                  <button aria-label="camera">    <FontAwesomeIcon icon={faCamera} /></button>
                  <button aria-label="style">     <FontAwesomeIcon icon={faPalette} /></button>
                  <button aria-label="insights">  <FontAwesomeIcon icon={faLightbulb} /></button>
                </div>

                {/* Bottom-left branding */}
                <div className="map-overlay geo-logo">geoFluxus</div>

                {/* Stream detail panel (replaces legend when a flow is selected) */}
                {selectedFlow && (
                  <StreamDetailPanel
                    flow={selectedFlow}
                    onClose={() => { setSelectedFlow(null); setSelectedMaterial(null); }}
                  />
                )}

                {/* Right legend panel */}
                <div className={`legend-panel${selectedFlow ? ' legend-panel--hidden' : ''}`}>
                  {/* Totals */}
                  <section className="legend-section">
                    <h3 className="legend-title">Totals</h3>
                    <div className="totals-grid">
                      <div className="totals-cell">
                        <div className="totals-header">
                          <FontAwesomeIcon icon={faTruck} className="totals-icon" />
                          <span className="totals-label">Total distance</span>
                        </div>
                        <span className="totals-value">{TOTALS.distance.toLocaleString()} km</span>
                      </div>
                      <div className="totals-cell">
                        <div className="totals-header">
                          <FontAwesomeIcon icon={faBoxesStacked} className="totals-icon" />
                          <span className="totals-label">Number of freights</span>
                        </div>
                        <span className="totals-value">{TOTALS.freights.toLocaleString()}</span>
                      </div>
                      <div className="totals-cell">
                        <div className="totals-header">
                          <FontAwesomeIcon icon={faCloud} className="totals-icon" />
                          <span className="totals-label">CO₂ from transport</span>
                        </div>
                        <span className="totals-value">{TOTALS.co2.toLocaleString()} t</span>
                      </div>
                      <div className="totals-cell">
                        <div className="totals-header">
                          <FontAwesomeIcon icon={faArrowsLeftRight} className="totals-icon" />
                          <span className="totals-label">Number of streams</span>
                        </div>
                        <span className="totals-value">{TOTALS.streams.toLocaleString()}</span>
                      </div>
                    </div>
                  </section>

                  {/* Largest streams */}
                  <section className="legend-section">
                    <h3 className="legend-title">Largest streams</h3>
                    {largestStreams.map(flow => {
                      const risk = computeRisk(flow);
                      return (
                        <div
                          key={flow.material}
                          className={[
                            'stream-item',
                            selectedMaterial === flow.material  ? 'stream-item--active'  : '',
                            selectedMaterial && selectedMaterial !== flow.material ? 'stream-item--dimmed' : '',
                          ].join(' ')}
                          onClick={() => handleLegendClick(flow.material)}
                        >
                          <span className="stream-dot" style={{ background: flow.color }} />
                          <div className="stream-info">
                            <span className="stream-material">{flow.material}</span>
                            <span className="stream-route">{flow.from} › {flow.to}</span>
                          </div>
                          <div className="stream-value">
                            <span className={`stream-risk-chip stream-risk-chip--${risk.level.toLowerCase()}`}>
                              {risk.level}
                            </span>
                            {flow.tonnage} t
                          </div>
                        </div>
                      );
                    })}
                  </section>

                  {/* Longest distance */}
                  <section className="legend-section">
                    <h3 className="legend-title">Longest distance</h3>
                    {longestDistance.map(flow => {
                      const risk = computeRisk(flow);
                      return (
                        <div
                          key={flow.material}
                          className={[
                            'stream-item',
                            selectedMaterial === flow.material  ? 'stream-item--active'  : '',
                            selectedMaterial && selectedMaterial !== flow.material ? 'stream-item--dimmed' : '',
                          ].join(' ')}
                          onClick={() => handleLegendClick(flow.material)}
                        >
                          <span className="stream-dot" style={{ background: flow.color }} />
                          <div className="stream-info">
                            <span className="stream-material">{flow.material}</span>
                            <span className="stream-route">{flow.from} › {flow.to}</span>
                          </div>
                          <div className="stream-value">
                            <span className={`stream-risk-chip stream-risk-chip--${risk.level.toLowerCase()}`}>
                              {risk.level}
                            </span>
                            {flow.distance} km
                          </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
