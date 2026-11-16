import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Zap, Eye, Lock, Flame, Activity, RotateCcw, Sparkles } from 'lucide-react';
import { ToolCallEvent } from '../types';

export interface ThreeFirewallCanvasProps {
  events?: ToolCallEvent[];
  activeFeatureFocus?: 'all' | 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge';
  onSelectFeature?: (feature: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => void;
  onTriggerSimulatedAttack?: (scenarioKey: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge') => void;
  theme?: 'dark' | 'lavender';
  height?: number | string;
  showControls?: boolean;
}

export interface PillarMeta {
  id: 'taint' | 'canary' | 'shield' | 'dlp' | 'challenge';
  title: string;
  modulePath: string;
  colorHex: string;
  colorInt: number;
  radius: number;
  metricLabel: string;
  description: string;
}

export const PILLARS: PillarMeta[] = [
  {
    id: 'taint',
    title: 'Ring 1: Taint & Provenance DAG',
    modulePath: 'src/cerberus/detectors/taint.py',
    colorHex: '#7C3AED',
    colorInt: 0x7c3aed,
    radius: 1.55,
    metricLabel: 'SHA-256 Lineage • 1.0 BLOCK Override',
    description: 'Tags github_issues/web_search/email_inbox as UNTRUSTED_WEB and deterministically blocks egress mimicry.'
  },
  {
    id: 'canary',
    title: 'Ring 2: ASI10 Honeytoken Vault',
    modulePath: 'src/cerberus/detectors/canary.py',
    colorHex: '#DB2777',
    colorInt: 0xdb2777,
    radius: 2.15,
    metricLabel: 'O(1) Hash Lookup • Auto-Quarantine',
    description: 'Plants decoy AWS keys, DB strings, JWTs & .env.canary secrets. Any hit triggers immediate QUARANTINE.'
  },
  {
    id: 'shield',
    title: 'Ring 3: Response Shield & LLM Adjudicator',
    modulePath: 'src/cerberus/proxy/response_inspector.py',
    colorHex: '#0284C7',
    colorInt: 0x0284c7,
    radius: 2.75,
    metricLabel: 'Prompt Injection Redaction • Async LLM',
    description: 'Scans tool outputs & tools/list schemas for <system> overrides & hidden Markdown beacons before reflection.'
  },
  {
    id: 'dlp',
    title: 'Ring 4: Egress DLP & Sliding Quotas',
    modulePath: 'src/cerberus/detectors/dlp.py',
    colorHex: '#D97706',
    colorInt: 0xd97706,
    radius: 3.35,
    metricLabel: '500 KB / 60s • Max 5 Hosts / 60s',
    description: 'Blocks outbound PII/API secrets and enforces rolling per-agent byte & destination sliding windows.'
  },
  {
    id: 'challenge',
    title: 'Ring 5: Cryptographic HITL Challenge Gate',
    modulePath: 'src/cerberus/proxy/challenge_manager.py',
    colorHex: '#CA8A04',
    colorInt: 0xca8a04,
    radius: 3.95,
    metricLabel: 'HMAC-SHA256 Step-Up • Fail-Closed TTL',
    description: 'Pauses CHALLENGE-band calls with single-use HMAC tokens and Slack Block-Kit webhook verification.'
  }
];

export const ThreeFirewallCanvas: React.FC<ThreeFirewallCanvasProps> = ({
  events = [],
  activeFeatureFocus = 'all',
  onSelectFeature,
  onTriggerSimulatedAttack,
  theme = 'lavender',
  height = 360,
  showControls = true
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarMeta>(PILLARS[0]);
  const [cameraPreset, setCameraPreset] = useState<'orbital' | 'top' | 'side'>('orbital');
  const [lastShockwaveText, setLastShockwaveText] = useState<string>('Taint Provenance 1.0 BLOCK Override Active');
  const triggerShockwaveRef = useRef<((colorInt: number, ringIndex: number) => void) | null>(null);

  const isLavender = theme === 'lavender';

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 860;
    const canvasHeight = typeof height === 'number' ? height : (container.clientHeight || 360);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isLavender ? 0xf5f3ff : 0x05070b, isLavender ? 0.045 : 0.065);

    const camera = new THREE.PerspectiveCamera(48, width / canvasHeight, 0.1, 100);
    camera.position.set(0, 4.2, 8.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, canvasHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(isLavender ? 0xf5f3ff : 0x05070b, isLavender ? 0.0 : 1.0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Ambient + Point Lights
    const ambient = new THREE.AmbientLight(0xffffff, isLavender ? 0.85 : 0.65);
    scene.add(ambient);
    const coreLight = new THREE.PointLight(isLavender ? 0x7c3aed : 0x00f0ff, isLavender ? 2.8 : 2.4, 20);
    coreLight.position.set(0, 1.8, 2.5);
    scene.add(coreLight);

    // Subtle Crystalline Grid Helper on Ground Plane
    if (isLavender) {
      const grid = new THREE.GridHelper(18, 36, 0xddd6fe, 0xede9fe);
      grid.position.y = -2.2;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.55;
      scene.add(grid);
    } else {
      const grid = new THREE.GridHelper(18, 36, 0x1e293b, 0x0f172a);
      grid.position.y = -2.2;
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.35;
      scene.add(grid);
    }

    // Central Cerberus Core (Icosahedron + Inner Wireframe)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const coreGeo = new THREE.IcosahedronGeometry(0.88, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: isLavender ? 0x6654e8 : 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: isLavender ? 0.85 : 0.75
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    const innerGeo = new THREE.OctahedronGeometry(0.55, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: isLavender ? 0x9333ea : 0x38bdf8,
      transparent: true,
      opacity: isLavender ? 0.65 : 0.45
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // 5 Concentric Security Rings
    const ringMeshes: THREE.Mesh[] = [];
    PILLARS.forEach((pillar, idx) => {
      const ringGeo = new THREE.TorusGeometry(pillar.radius, 0.035, 16, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pillar.colorInt,
        transparent: true,
        opacity: isLavender ? 0.8 : 0.68
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (idx % 2 === 0 ? 0.18 : -0.18);
      ring.rotation.y = idx * 0.25;
      scene.add(ring);
      ringMeshes.push(ring);
    });

    // Packet Particles Flowing from Ingress (-X) through Cerberus Core (0) to Egress (+X)
    interface PacketParticle {
      mesh: THREE.Mesh;
      t: number;
      speed: number;
      laneY: number;
      laneZ: number;
      isBlocked: boolean;
      blockRadius: number;
      colorInt: number;
    }

    const packets: PacketParticle[] = [];
    const packetGeo = new THREE.SphereGeometry(0.085, 12, 12);

    for (let i = 0; i < 32; i++) {
      const pillar = PILLARS[i % PILLARS.length];
      const isBlocked = i % 3 !== 0;
      const mat = new THREE.MeshBasicMaterial({
        color: isBlocked ? pillar.colorInt : 0x10b981
      });
      const mesh = new THREE.Mesh(packetGeo, mat);
      scene.add(mesh);
      packets.push({
        mesh,
        t: Math.random(),
        speed: 0.0035 + Math.random() * 0.0035,
        laneY: (Math.random() - 0.5) * 2.2,
        laneZ: (Math.random() - 0.5) * 2.6,
        isBlocked,
        blockRadius: pillar.radius * 0.35,
        colorInt: pillar.colorInt
      });
    }

    // Shockwave Ring on Intercept
    const shockGeo = new THREE.RingGeometry(0.2, 0.35, 48);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    const shockMesh = new THREE.Mesh(shockGeo, shockMat);
    shockMesh.rotation.x = Math.PI / 2;
    scene.add(shockMesh);

    let shockScale = 1;
    let shockAlpha = 0;

    triggerShockwaveRef.current = (colorInt: number, ringIndex: number) => {
      shockMat.color.setHex(colorInt);
      shockScale = 0.8 + ringIndex * 0.45;
      shockAlpha = 0.95;
    };

    // Mouse Drag Orbital Control
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let azimuth = 0.35;
    let elevation = 0.48;
    const distance = 9.2;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      azimuth -= dx * 0.007;
      elevation = Math.max(0.12, Math.min(1.35, elevation + dy * 0.006));
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDragging) {
        azimuth += 0.0022;
      }

      if (cameraPreset === 'top') {
        camera.position.lerp(new THREE.Vector3(0, 9.6, 0.8), 0.06);
      } else if (cameraPreset === 'side') {
        camera.position.lerp(new THREE.Vector3(0, 1.2, 10.2), 0.06);
      } else {
        const cx = distance * Math.sin(azimuth) * Math.cos(elevation);
        const cy = distance * Math.sin(elevation);
        const cz = distance * Math.cos(azimuth) * Math.cos(elevation);
        camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.08);
      }
      camera.lookAt(0, 0, 0);

      coreMesh.rotation.y += 0.008;
      coreMesh.rotation.x += 0.004;
      innerMesh.rotation.y -= 0.012;

      ringMeshes.forEach((r, idx) => {
        r.rotation.z += (idx % 2 === 0 ? 1 : -1) * (0.003 + idx * 0.0008);
      });

      packets.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const x = -6.5 + p.t * 13.0;
        const arch = Math.sin(p.t * Math.PI);
        p.mesh.position.set(x, p.laneY * arch, p.laneZ * arch);

        if (p.isBlocked && p.t > 0.48 && p.t < 0.54) {
          p.mesh.scale.setScalar(1.65);
        } else if (p.isBlocked && p.t >= 0.54) {
          // Deflected/neutralized packet fades out before reaching egress sink
          p.mesh.scale.setScalar(Math.max(0.01, 1.0 - (p.t - 0.54) * 3.2));
        } else {
          p.mesh.scale.setScalar(1.0);
        }
      });

      if (shockAlpha > 0.01) {
        shockScale += 0.16;
        shockAlpha *= 0.92;
        shockMesh.scale.setScalar(shockScale);
        shockMat.opacity = shockAlpha;
      } else {
        shockMat.opacity = 0;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 860;
      const h = typeof height === 'number' ? height : (container.clientHeight || 360);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [cameraPreset, isLavender, height]);

  const handleSelectPillar = (pillar: PillarMeta, idx: number) => {
    setSelectedPillar(pillar);
    if (triggerShockwaveRef.current) {
      triggerShockwaveRef.current(pillar.colorInt, idx);
    }
    setLastShockwaveText(`${pillar.title} — ${pillar.metricLabel}`);
    if (onSelectFeature) onSelectFeature(pillar.id);
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        isLavender
          ? 'border-[#EDE9FE] bg-white/95 shadow-lavender text-[#171638]'
          : 'border-slate-800/90 bg-[#070B12] shadow-2xl text-white'
      }`}
    >
      {/* Top 3D Command Header */}
      {showControls && (
        <div
          className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLavender ? 'border-[#EDE9FE] bg-[#F5F3FF]/70' : 'border-slate-800/80 bg-slate-950/90'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-ping ${
                isLavender ? 'bg-[#7C3AED]' : 'bg-cyan-400'
              }`}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2
                  className={`text-sm font-bold tracking-wider uppercase font-mono ${
                    isLavender ? 'text-[#171638]' : 'text-white'
                  }`}
                >
                  3D Neural Behavioral Firewall & Provenance Topology
                </h2>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    isLavender
                      ? 'bg-[#EDE9FE] text-[#6654E8] border-[#DDD6FE]'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  WebGL Three.js • 5-Ring Zero-Trust Gate
                </span>
              </div>
              <p className={`text-xs ${isLavender ? 'text-[#5B5882]' : 'text-slate-400'}`}>
                Drag to orbit 3D topology • Click any defense ring to inspect detector & trigger live simulation
              </p>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={() => setCameraPreset('orbital')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                cameraPreset === 'orbital'
                  ? isLavender
                    ? 'bg-[#EDE9FE] text-[#6654E8] border-[#C4B5FD] font-semibold'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : isLavender
                  ? 'bg-white text-[#5B5882] border-[#EDE9FE] hover:border-[#DDD6FE]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              3D Orbit
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                cameraPreset === 'top'
                  ? isLavender
                    ? 'bg-[#EDE9FE] text-[#6654E8] border-[#C4B5FD] font-semibold'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : isLavender
                  ? 'bg-white text-[#5B5882] border-[#EDE9FE] hover:border-[#DDD6FE]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Top DAG View
            </button>
            <button
              onClick={() => setCameraPreset('side')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                cameraPreset === 'side'
                  ? isLavender
                    ? 'bg-[#EDE9FE] text-[#6654E8] border-[#C4B5FD] font-semibold'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : isLavender
                  ? 'bg-white text-[#5B5882] border-[#EDE9FE] hover:border-[#DDD6FE]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Cross-Section
            </button>
          </div>
        </div>
      )}

      {/* Main Split: 3D WebGL Viewport + Live 5-Pillar Detector HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div
          className={`lg:col-span-8 relative ${
            isLavender
              ? 'bg-gradient-to-b from-[#F5F3FF] via-[#EDE9FE]/50 to-[#F5F3FF]'
              : 'bg-gradient-to-b from-[#05070B] via-[#08101E] to-[#05070B]'
          }`}
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating 3D Viewport Telemetry Overlays */}
          <div className="absolute top-3 left-3 pointer-events-none space-y-1.5">
            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center space-x-2 backdrop-blur-md ${
                isLavender
                  ? 'bg-white/85 border-[#DDD6FE] text-[#5543D6] shadow-xs'
                  : 'bg-slate-950/85 border-slate-800 text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>INGRESS: github_issues • web_search • email_inbox • .env.canary</span>
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center space-x-2 backdrop-blur-md ${
                isLavender
                  ? 'bg-white/85 border-[#DDD6FE] text-[#B91C1C] shadow-xs'
                  : 'bg-slate-950/85 border-slate-800 text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>EGRESS SINKS: http_post • send_email • slack_webhook • aws_s3_upload</span>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md ${
                isLavender
                  ? 'bg-white/90 border-[#C4B5FD] text-[#6654E8] shadow-xs'
                  : 'bg-slate-950/90 border-cyan-500/30 text-cyan-300'
              }`}
            >
              ACTIVE INTERCEPT: {lastShockwaveText}
            </div>
            <div
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono backdrop-blur-md ${
                isLavender
                  ? 'bg-white/90 border-[#EDE9FE] text-emerald-700 shadow-xs'
                  : 'bg-slate-950/90 border-slate-800 text-emerald-400'
              }`}
            >
              Events Buffered: {events.length} • Deterministic Fail-Closed: ARMED
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 5-Pillar Ring Selector & Live Attack Injector */}
        <div
          className={`lg:col-span-4 border-t lg:border-t-0 lg:border-l p-4 flex flex-col justify-between ${
            isLavender ? 'border-[#EDE9FE] bg-white' : 'border-slate-800/80 bg-[#0A0E17]'
          }`}
        >
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className={isLavender ? 'text-[#5B5882]' : 'text-slate-400'}>5-Layer Defense Rings</span>
              <span className={isLavender ? 'text-[#6654E8] font-semibold' : 'text-cyan-400'}>Click to Focus</span>
            </div>

            <div className="space-y-2">
              {PILLARS.map((pillar, idx) => {
                const isSelected = selectedPillar.id === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => handleSelectPillar(pillar, idx)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? isLavender
                          ? 'bg-[#F5F3FF] border-[#7C3AED] shadow-sm'
                          : 'bg-slate-900/95 border-cyan-400/50 shadow-lg'
                        : isLavender
                        ? 'bg-white border-[#EDE9FE] hover:border-[#DDD6FE]'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: pillar.colorHex }}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isLavender ? 'text-[#171638]' : 'text-white'
                          }`}
                        >
                          {pillar.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono ${isLavender ? 'text-[#8E8AA7]' : 'text-slate-400'}`}>
                        {pillar.modulePath.split('/').pop()}
                      </span>
                    </div>
                    <p
                      className="text-[11px] font-mono mt-1 font-medium"
                      style={{ color: pillar.colorHex }}
                    >
                      {pillar.metricLabel}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Pillar Detail + 1-Click Live Attack Packet Trigger */}
          <div
            className={`mt-3 pt-3 border-t ${
              isLavender ? 'border-[#EDE9FE]' : 'border-slate-800/80'
            }`}
          >
            <div
              className={`text-xs mb-2.5 leading-relaxed ${
                isLavender ? 'text-[#5B5882]' : 'text-slate-300'
              }`}
            >
              <span
                className={`font-mono text-[11px] block mb-0.5 ${
                  isLavender ? 'text-[#8E8AA7]' : 'text-slate-400'
                }`}
              >
                {selectedPillar.modulePath}
              </span>
              {selectedPillar.description}
            </div>

            <button
              onClick={() => {
                const idx = PILLARS.findIndex((p) => p.id === selectedPillar.id);
                if (triggerShockwaveRef.current) {
                  triggerShockwaveRef.current(selectedPillar.colorInt, Math.max(0, idx));
                }
                if (onTriggerSimulatedAttack) {
                  onTriggerSimulatedAttack(selectedPillar.id);
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#6654E8] via-[#7C3AED] to-[#5543D6] hover:from-[#5543D6] hover:to-[#4F46E5] text-white text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate {selectedPillar.id.toUpperCase()} Attack Packet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};