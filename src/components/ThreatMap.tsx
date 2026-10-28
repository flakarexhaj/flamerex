import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { SecurityEvent, Severity } from "../types";
import { SEVERITY_RANK } from "../data";
import { useStore } from "../store";

const GOLD = 0xd4af57;
const TILT = 0.25; // default tilt of the globe, in radians
const SECONDS_PER_TURN = 30; // seconds for one full turn

// Approximate [lat, lon] of each country. Add a line here if a new country shows up in your data.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  "United States": [39.8, -98.6], "United States of America": [39.8, -98.6], USA: [39.8, -98.6],
  "United Kingdom": [55.4, -3.4], UK: [55.4, -3.4],
  Germany: [51.2, 10.4], France: [46.2, 2.2], Italy: [41.9, 12.6], Spain: [40.4, -3.7], Portugal: [39.4, -8.2],
  Belgium: [50.5, 4.5], Netherlands: [52.1, 5.3], Switzerland: [46.8, 8.2], Austria: [47.5, 14.6],
  Czechia: [49.8, 15.5], "Czech Republic": [49.8, 15.5], Poland: [51.9, 19.1], Hungary: [47.2, 19.5],
  Romania: [45.9, 24.9], Bulgaria: [42.7, 25.5], Greece: [39.1, 21.8], Croatia: [45.1, 15.2],
  Kosovo: [42.6, 20.9], Albania: [41.2, 20.2], "North Macedonia": [41.6, 21.7], Serbia: [44.0, 21.0],
  Ireland: [53.4, -8.2], Denmark: [56.3, 9.5], Sweden: [60.1, 18.6], Norway: [60.5, 8.5], Finland: [61.9, 25.7],
  Ukraine: [48.4, 31.2], Belarus: [53.7, 27.9], Russia: [61.5, 105.3], Kazakhstan: [48.0, 66.9],
  Turkey: [39.0, 35.2], Türkiye: [39.0, 35.2], Israel: [31.0, 34.8], Iraq: [33.2, 43.7], Iran: [32.4, 53.7],
  "Saudi Arabia": [23.9, 45.1], UAE: [24.0, 54.0], "United Arab Emirates": [24.0, 54.0],
  Pakistan: [30.4, 69.3], India: [20.6, 78.9], Bangladesh: [23.7, 90.4],
  China: [35.9, 104.2], "Hong Kong": [22.3, 114.2], Taiwan: [23.7, 121.0], Japan: [36.2, 138.3],
  "South Korea": [35.9, 127.8], Vietnam: [14.1, 108.3], Thailand: [15.9, 101.0], Malaysia: [4.2, 102.0],
  Singapore: [1.35, 103.8], Indonesia: [-0.8, 113.9], Philippines: [12.9, 121.8],
  Australia: [-25.3, 133.8], "New Zealand": [-40.9, 174.9],
  Egypt: [26.8, 30.8], Morocco: [31.8, -7.1], Algeria: [28.0, 1.7], Nigeria: [9.1, 8.7], Ghana: [7.9, -1.0],
  Ethiopia: [9.1, 40.5], Kenya: [0.0, 37.9], "South Africa": [-30.6, 22.9],
  Canada: [56.1, -106.3], Mexico: [23.6, -102.5], Brazil: [-14.2, -51.9], Argentina: [-38.4, -63.6],
  Chile: [-35.7, -71.5], Colombia: [4.6, -74.3], Peru: [-9.2, -75.0], Venezuela: [6.4, -66.6],
};

const COORDS_BY_NAME = new Map<string, [number, number]>(
  Object.entries(COUNTRY_COORDS).map(([name, c]): [string, [number, number]] => [name.toLowerCase(), c])
);
const getCoordinates = (country: string) => COORDS_BY_NAME.get(country.trim().toLowerCase());

function toVector(lat: number, lon: number, radius = 1.49) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

// Rotation that brings a country to the center of the globe, facing the camera
function facing(lat: number, lon: number) {
  const p = toVector(lat, lon, 1);
  const tilt = Math.atan2(p.y, Math.hypot(p.x, p.z));
  return { yaw: -Math.atan2(p.x, p.z), tilt: Math.max(-1.1, Math.min(1.1, tilt)) };
}

const SEVERITY_HEX: Record<Severity, number> = { critical: 0xff4d4d, high: 0xffa34d, medium: 0xf5df9b, low: GOLD };
const css = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

interface CountryStat {
  country: string;
  coords: [number, number] | undefined;
  count: number;
  unresolvedCritical: number;
  top: Severity;
  latest: SecurityEvent;
}
type Mapped = CountryStat & { coords: [number, number] };

interface Marker { group: THREE.Group; dot: THREE.Mesh; ring: THREE.Mesh; hit: THREE.Mesh; size: number; phase: number; }

function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
}

function createMarker(country: string, [lat, lon]: [number, number]): Marker {
  const pos = toVector(lat, lon);
  const group = new THREE.Group();
  group.position.copy(pos);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()); // +z points away from the globe

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshBasicMaterial({ color: GOLD }));
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.065, 32),
    new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  // Invisible bigger sphere so markers are easy to tap
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hit.userData.country = country;
  group.add(dot, ring, hit);
  return { group, dot, ring, hit, size: 1, phase: Math.random() * Math.PI * 2 };
}

export default function ThreatMap() {
  const mountRef = useRef<HTMLDivElement>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const targetRef = useRef<{ yaw: number; tilt: number } | null>(null);
  const pausedRef = useRef(false);

  const events = useStore((s) => s.events);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // One entry per country, so each country is one marker no matter how many events it has
  const stats = useMemo(() => {
    const map = new Map<string, CountryStat>();
    for (const e of events) {
      const cur = map.get(e.country);
      const unresolved = e.severity === "critical" && e.status !== "resolved" ? 1 : 0;
      if (!cur) {
        map.set(e.country, { country: e.country, coords: getCoordinates(e.country), count: 1, unresolvedCritical: unresolved, top: e.severity, latest: e });
        continue;
      }
      cur.count++;
      cur.unresolvedCritical += unresolved;
      if (SEVERITY_RANK[e.severity] > SEVERITY_RANK[cur.top]) cur.top = e.severity;
      if (e.time > cur.latest.time) cur.latest = e;
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [events]);

  const mapped = useMemo(() => stats.filter((s): s is Mapped => s.coords !== undefined), [stats]);
  const unmapped = stats.filter((s) => s.coords === undefined);
  const selected = stats.find((s) => s.country === selectedCountry) ?? null;
  const criticalCount = stats.reduce((n, s) => n + s.unresolvedCritical, 0);

  useEffect(() => { pausedRef.current = selectedCountry !== null; }, [selectedCountry]);

  // Scene: created once
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const markers = markersRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.touchAction = "pan-y"; // vertical swipe still scrolls the page on phones
    canvas.style.cursor = "grab";
    mount.appendChild(canvas);

    const globe = new THREE.Group();
    globe.rotation.x = TILT;
    scene.add(globe);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x140d22, metalness: 0.8, roughness: 0.35, emissive: GOLD, emissiveIntensity: 0.05 })
    );
    globe.add(sphere);
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.465, 32, 24),
      new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.13 })
    ));

    const markerGroup = new THREE.Group();
    globe.add(markerGroup);
    markerGroupRef.current = markerGroup;

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const l1 = new THREE.PointLight(0xf5df9b, 65); l1.position.set(3, 3, 4); scene.add(l1);
    const l2 = new THREE.PointLight(0x8b6425, 35); l2.position.set(-3, -1, 2); scene.add(l2);

    // Interaction: drag to rotate, tap a marker to select its country
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false, hovering = false, moved = 0, lastX = 0;

    const pick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      // The globe is included so markers on the far side cannot be clicked through it
      const targets: THREE.Object3D[] = [sphere, ...Array.from(markers.values(), (m) => m.hit)];
      const name = raycaster.intersectObjects(targets, false)[0]?.object.userData.country as string | undefined;
      if (name) setSelectedCountry(name);
    };
    const onDown = (e: PointerEvent) => {
      dragging = true; moved = 0; lastX = e.clientX; targetRef.current = null;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      globe.rotation.y += dx * 0.006;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (moved < 6) pick(e);
    };
    const onCancel = () => { dragging = false; canvas.style.cursor = "grab"; };
    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);

    const clock = new THREE.Clock();
    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const t = clock.elapsedTime;
      const target = targetRef.current;

      if (target) {
        // Smoothly turn to the chosen country, taking the shortest way around
        const dy = Math.atan2(Math.sin(target.yaw - globe.rotation.y), Math.cos(target.yaw - globe.rotation.y));
        const dx = target.tilt - globe.rotation.x;
        globe.rotation.y += dy * 0.08;
        globe.rotation.x += dx * 0.08;
        if (Math.abs(dy) < 0.002 && Math.abs(dx) < 0.002) targetRef.current = null;
      } else if (!dragging && !hovering && !pausedRef.current && !reduceMotion) {
        globe.rotation.y += ((Math.PI * 2) / SECONDS_PER_TURN) * delta;
      }

      markers.forEach((m) => {
        m.ring.scale.setScalar(m.size * (reduceMotion ? 1 : 1 + 0.3 * Math.sin(t * 2.2 + m.phase)));
      });
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      disposeObject(scene);
      markers.clear();
      renderer.dispose();
      canvas.remove();
      markerGroupRef.current = null;
    };
  }, []);

  // Markers: one per country, updated in place when events change
  useEffect(() => {
    const group = markerGroupRef.current;
    if (!group) return;
    const markers = markersRef.current;
    const seen = new Set<string>();

    mapped.forEach((s) => {
      seen.add(s.country);
      let m = markers.get(s.country);
      if (!m) {
        m = createMarker(s.country, s.coords);
        markers.set(s.country, m);
        group.add(m.group);
      }
      const color = SEVERITY_HEX[s.top];
      (m.dot.material as THREE.MeshBasicMaterial).color.setHex(color);
      (m.ring.material as THREE.MeshBasicMaterial).color.setHex(color);
      const base = 0.8 + (Math.min(s.count, 80) / 80) * 1.2; // busier countries get bigger markers
      m.size = base * (s.country === selectedCountry ? 1.7 : 1);
      m.dot.scale.setScalar(base);
    });

    Array.from(markers.entries()).forEach(([name, m]) => {
      if (seen.has(name)) return;
      group.remove(m.group);
      disposeObject(m.group);
      markers.delete(name);
    });
  }, [mapped, selectedCountry]);

  const choose = (s: CountryStat) => {
    setSelectedCountry(s.country);
    if (s.coords) targetRef.current = facing(s.coords[0], s.coords[1]);
  };

  // Clicking a marker on the globe also turns the globe to that country
  useEffect(() => {
    const s = stats.find((x) => x.country === selectedCountry);
    if (s?.coords && !targetRef.current) targetRef.current = facing(s.coords[0], s.coords[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300">FLAMEREX / GLOBAL INTELLIGENCE</p>
          <h3 className="mt-2 text-lg font-semibold text-amber-50">Global Threat Map</h3>
          <p className="mt-1 text-xs text-amber-100/50">Drag to rotate · tap a marker or pick a country below</p>
        </div>
        <div className="flex gap-6 text-xs">
          <div>
            <p className="text-amber-100/50">Countries</p>
            <p className="mt-1 text-xl font-semibold text-amber-200">{mapped.length}</p>
          </div>
          <div>
            <p className="text-amber-100/50">Unresolved critical</p>
            <p className="mt-1 text-xl font-semibold text-red-400">{criticalCount}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,87,0.12),transparent_65%)]" />
        <div
          ref={mountRef}
          role="img"
          aria-label="3D globe showing where threats come from. Use the country list below the globe to explore."
          className="relative z-10 h-[360px] w-full sm:h-[430px]"
        />
      </div>

      <div className="flex flex-wrap gap-4 border-t border-violet-500/15 py-3 text-xs text-amber-100/70">
        <span><span className="text-red-400">●</span> Critical</span>
        <span><span className="text-orange-300">●</span> High</span>
        <span><span className="text-amber-200">●</span> Medium</span>
        <span><span className="text-amber-500">●</span> Low</span>
        <span className="text-amber-100/40">Marker color shows the highest severity in that country. Bigger means more events.</span>
      </div>

      <div className="border-t border-violet-500/15 py-5">
        <h4 className="mb-3 text-xs font-semibold tracking-widest text-amber-400">COUNTRIES ({stats.length})</h4>
        <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <li key={s.country}>
              <button
                onClick={() => choose(s)}
                aria-pressed={s.country === selectedCountry}
                className={`flex w-full items-center gap-2 py-2 text-left text-xs transition-colors ${
                  s.country === selectedCountry ? "text-amber-200 underline decoration-amber-400/60 underline-offset-4" : "text-amber-100/80 hover:text-amber-100"
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: css(SEVERITY_HEX[s.top]) }} />
                <span className="min-w-0 flex-1 truncate">{s.country}</span>
                <span className="tabular-nums text-amber-100/50">{s.count}</span>
              </button>
            </li>
          ))}
        </ul>
        {unmapped.length > 0 && (
          <p className="mt-3 text-xs text-amber-100/50">
            No map position yet for: {unmapped.map((s) => s.country).join(", ")}. Add them to COUNTRY_COORDS in ThreatMap.tsx.
          </p>
        )}
      </div>

      {selected && (
        <div className="border-t border-violet-500/15 py-5 text-sm text-amber-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-amber-400">SELECTED COUNTRY</p>
              <h4 className="mt-2 text-base font-semibold">{selected.country}</h4>
            </div>
            <button onClick={() => setSelectedCountry(null)} className="text-xs text-amber-200 underline-offset-4 hover:underline">
              Close
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-xs text-amber-100/45">Events</p><p className="mt-1">{selected.count}</p></div>
            <div><p className="text-xs text-amber-100/45">Unresolved critical</p><p className="mt-1">{selected.unresolvedCritical}</p></div>
            <div><p className="text-xs text-amber-100/45">Highest severity</p><p className="mt-1 capitalize">{selected.top}</p></div>
            <div><p className="text-xs text-amber-100/45">Latest source IP</p><p className="mt-1 break-all">{selected.latest.ip}</p></div>
          </div>
          <p className="mt-3 text-xs text-amber-100/45">
            Latest: {selected.latest.type} on {selected.latest.target} · {selected.latest.status} · {new Date(selected.latest.time).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}
