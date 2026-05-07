import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: iconShadow });

export type ProcessingMethodKey = 'hergebruiken' | 'recycling' | 'terugwinning' | 'verwijderen' | 'onbekend';

export interface FlowEntry {
  material: string;
  color: string;
  from: string;
  to: string;
  tonnage: number;
  distance: number;
  count: number;
  composition: string[];
  wasteCode: string;
  isDangerous: boolean;
  processingMethod: ProcessingMethodKey;
  dataSource: string;
  processorType: string;
}

export const FLOW_ENTRIES: FlowEntry[] = [
  {
    material: 'Concrete', color: '#8B7355', from: 'Nijmegen', to: 'PreZero',
    tonnage: 182, distance: 70, count: 11,
    composition: ['Brokken', 'Gewapend beton', 'Funderingsmateriaal', 'Betongranulaat'],
    wasteCode: '170101', isDangerous: false, processingMethod: 'recycling',
    dataSource: 'EVOA 2023 Q1–Q4', processorType: 'Concrete recycling facility',
  },
  {
    material: 'Wood', color: '#E8956D', from: 'Nijmegen', to: 'Avalex',
    tonnage: 176, distance: 58, count: 8,
    composition: ['Hout A', 'Hout B', 'Sloopafval', 'Verduurzaamd hout'],
    wasteCode: '170201', isDangerous: false, processingMethod: 'terugwinning',
    dataSource: 'EVOA 2023 Q1–Q4', processorType: 'Energy recovery facility',
  },
  {
    material: 'Batteries', color: '#6EC26B', from: 'Nijmegen', to: 'Renewi.B.V',
    tonnage: 143, distance: 78, count: 15,
    composition: ['Li-ion', 'Lood-accu', 'NiMH', 'Alkaline'],
    wasteCode: '160601', isDangerous: true, processingMethod: 'recycling',
    dataSource: 'REACH-verklaring 2023', processorType: 'Specialized hazardous waste processor',
  },
  {
    material: 'Metals', color: '#DC3545', from: 'Strijen', to: 'Renewi.B.V',
    tonnage: 111, distance: 123, count: 7,
    composition: ['Koper', 'Aluminium', 'Staal', 'Ijzer'],
    wasteCode: '170407', isDangerous: false, processingMethod: 'hergebruiken',
    dataSource: 'EVOA 2023 Q2–Q3', processorType: 'Metal recovery and reuse facility',
  },
  {
    material: 'Soil', color: '#2B4B8A', from: 'Nijmegen', to: 'Avalex',
    tonnage: 98, distance: 283, count: 4,
    composition: ['Verontreinigde grond', 'Puin', 'Asfalt', 'Klei'],
    wasteCode: '170504', isDangerous: true, processingMethod: 'verwijderen',
    dataSource: 'BSAB-registratie 2023', processorType: 'Soil treatment and disposal facility',
  },
  {
    material: 'Plastic', color: '#4A90E2', from: 'Nijmegen', to: 'PreZero',
    tonnage: 85, distance: 95, count: 12,
    composition: ['PE', 'PP', 'PVC', 'Gemengd plastic'],
    wasteCode: '170203', isDangerous: false, processingMethod: 'onbekend',
    dataSource: 'EVOA 2023 Q1–Q4', processorType: 'Plastic sorting facility',
  },
];

function makeArc(
  from: [number, number],
  to: [number, number],
  bend: number,
  steps = 40
): L.LatLngExpression[] {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const ctrlLat = midLat - dLng * bend;
  const ctrlLng = midLng + dLat * bend;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const lat = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * ctrlLat + t ** 2 * to[0];
    const lng = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * ctrlLng + t ** 2 * to[1];
    return [lat, lng] as L.LatLngExpression;
  });
}

const NIJMEGEN:  [number, number] = [51.845, 5.865];
const PREZERO:   [number, number] = [52.37,  4.89 ];
const AVALEX_W:  [number, number] = [52.08,  4.27 ];
const AVALEX_S:  [number, number] = [50.85,  4.35 ];
const RENEWI:    [number, number] = [51.37,  6.17 ];
const STRIJEN:   [number, number] = [51.75,  4.55 ];

interface ArcConfig {
  from: [number, number];
  to: [number, number];
  bend: number;
  idx: number;
  weight: number;
  opacity: number;
}

const ARC_CONFIGS: ArcConfig[] = [
  { from: NIJMEGEN, to: PREZERO,  bend:  0.35, idx: 0, weight: 10, opacity: 0.65 },
  { from: NIJMEGEN, to: AVALEX_W, bend:  0.30, idx: 1, weight:  9, opacity: 0.60 },
  { from: NIJMEGEN, to: RENEWI,   bend: -0.20, idx: 2, weight:  8, opacity: 0.60 },
  { from: STRIJEN,  to: RENEWI,   bend: -0.15, idx: 3, weight:  9, opacity: 0.60 },
  { from: NIJMEGEN, to: AVALEX_S, bend:  0.55, idx: 4, weight: 12, opacity: 0.65 },
  { from: NIJMEGEN, to: PREZERO,  bend:  0.15, idx: 5, weight:  8, opacity: 0.55 },
];

// Returns the geographic midpoint (t=0.5) of a flow's bezier arc.
export function getArcMidpoint(material: string): [number, number] | null {
  const cfg = ARC_CONFIGS.find(c => FLOW_ENTRIES[c.idx].material === material);
  if (!cfg) return null;
  const { from, to, bend } = cfg;
  const midLat  = (from[0] + to[0]) / 2;
  const midLng  = (from[1] + to[1]) / 2;
  const ctrlLat = midLat  - (to[1] - from[1]) * bend;
  const ctrlLng = midLng  + (to[0] - from[0]) * bend;
  return [
    0.25 * from[0] + 0.5 * ctrlLat + 0.25 * to[0],
    0.25 * from[1] + 0.5 * ctrlLng + 0.25 * to[1],
  ];
}

const MARKERS = [
  { name: 'Nijmegen',    pos: NIJMEGEN },
  { name: 'PreZero',     pos: PREZERO  },
  { name: 'Avalex (NL)', pos: AVALEX_W },
  { name: 'Renewi.B.V',  pos: RENEWI   },
  { name: 'Strijen',     pos: STRIJEN  },
];

interface MapProps {
  onMapReady?: (map: L.Map) => void;
  selectedMaterial?: string | null;
  onFlowClick?: (flow: FlowEntry, pixel: { x: number; y: number }) => void;
  onMapClick?: () => void;
}

export default function Map({ onMapReady, selectedMaterial, onFlowClick, onMapClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const polylineRefs = useRef<Record<string, L.Polyline>>({});

  // Keep callback refs stable so map init never re-runs due to prop changes
  const onFlowClickRef = useRef(onFlowClick);
  const onMapClickRef  = useRef(onMapClick);
  useEffect(() => { onFlowClickRef.current = onFlowClick; }, [onFlowClick]);
  useEffect(() => { onMapClickRef.current  = onMapClick;  }, [onMapClick]);

  // Map initialisation — runs once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current, { zoomControl: false }).setView([51.8, 5.0], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      className: 'map-tiles',
    }).addTo(map.current);

    ARC_CONFIGS.forEach(({ from, to, bend, idx, weight, opacity }) => {
      const flow = FLOW_ENTRIES[idx];
      const polyline = L.polyline(makeArc(from, to, bend), {
        color: flow.color,
        weight,
        opacity,
        smoothFactor: 0.3,
      }).addTo(map.current!);

      polyline.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const pixel = map.current!.latLngToContainerPoint(e.latlng);
        onFlowClickRef.current?.(flow, { x: pixel.x, y: pixel.y });
      });

      // Widen hit area so thin arcs are easier to click
      polyline.on('mouseover', () => {
        if (polyline.options.opacity! > 0.15) {
          polyline.setStyle({ weight: (polyline.options.weight ?? weight) + 2 });
        }
      });
      polyline.on('mouseout', () => {
        polyline.setStyle({ weight });
      });

      polylineRefs.current[flow.material] = polyline;
    });

    MARKERS.forEach(({ name, pos }) => {
      L.circleMarker(pos, {
        radius: 7,
        fillColor: '#1f2937',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      })
        .addTo(map.current!)
        .bindPopup(`<strong>${name}</strong>`);
    });

    map.current.on('click', () => { onMapClickRef.current?.(); });

    onMapReady?.(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
      polylineRefs.current = {};
    };
  }, [onMapReady]);

  // Highlight / dim arcs whenever selectedMaterial changes
  useEffect(() => {
    ARC_CONFIGS.forEach(({ idx, weight, opacity }) => {
      const flow = FLOW_ENTRIES[idx];
      const poly = polylineRefs.current[flow.material];
      if (!poly) return;
      if (!selectedMaterial) {
        poly.setStyle({ opacity, weight });
      } else if (flow.material === selectedMaterial) {
        poly.setStyle({ opacity: Math.min(opacity + 0.25, 0.95), weight: weight + 3 });
      } else {
        poly.setStyle({ opacity: 0.1, weight });
      }
    });
  }, [selectedMaterial]);

  return <div ref={mapContainer} className="map-container" />;
}
