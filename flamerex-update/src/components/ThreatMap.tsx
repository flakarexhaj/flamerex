
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { SecurityEvent } from "../types";
import { useStore } from "../store";

const GOLD = 0xd4af57;

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "United States": [39.8, -98.6],
  "United States of America": [39.8, -98.6],
  USA: [39.8, -98.6],
  "United Kingdom": [55.4, -3.4],
  UK: [55.4, -3.4],
  Germany: [51.2, 10.4],
  France: [46.2, 2.2],
  Italy: [41.9, 12.6],
  Spain: [40.4, -3.7],
  Kosovo: [42.6, 20.9],
  Albania: [41.2, 20.2],
  "North Macedonia": [41.6, 21.7],
  Serbia: [44.0, 21.0],
  Switzerland: [46.8, 8.2],
  Netherlands: [52.1, 5.3],
  Poland: [51.9, 19.1],
  Ukraine: [48.4, 31.2],
  Russia: [61.5, 105.3],
  China: [35.9, 104.2],
  Japan: [36.2, 138.3],
  India: [20.6, 78.9],
  Singapore: [1.35, 103.8],
  Australia: [-25.3, 133.8],
  Brazil: [-14.2, -51.9],
  Canada: [56.1, -106.3],
  Mexico: [23.6, -102.5],
  Turkey: [39.0, 35.2],
  Türkiye: [39.0, 35.2],
  "Saudi Arabia": [23.9, 45.1],
  UAE: [24.0, 54.0],
  "United Arab Emirates": [24.0, 54.0],
  Iran: [32.4, 53.7],
  Israel: [31.0, 34.8],
  Egypt: [26.8, 30.8],
  "South Africa": [-30.6, 22.9],
  Nigeria: [9.1, 8.7],
  Sweden: [60.1, 18.6],
  Norway: [60.5, 8.5],
  Finland: [61.9, 25.7],
  Romania: [45.9, 24.9],
  Greece: [39.1, 21.8],
  Indonesia: [-0.8, 113.9],
  "South Korea": [35.9, 127.8],
};

function getCoordinates(country: string): [number, number] | undefined {
  const normalized = country.trim().toLowerCase();

  const entry = Object.entries(COUNTRY_COORDS).find(
    ([name]) => name.toLowerCase() === normalized
  );

  return entry?.[1];
}

function toVector(lat: number, lon: number, radius = 1.49) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function severityColor(severity: SecurityEvent["severity"]) {
  switch (severity) {
    case "critical":
      return 0xff4d4d;
    case "high":
      return 0xffa34d;
    case "medium":
      return 0xf5df9b;
    default:
      return GOLD;
  }
}

export default function ThreatMap() {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const events = useStore((state) => state.events);
  const [selected, setSelected] = useState<SecurityEvent | null>(null);

  const mappedEvents = useMemo(
    () =>
      events
        .map((event) => ({
          event,
          coords: getCoordinates(event.country),
        }))
        .filter(
          (
            item
          ): item is {
            event: SecurityEvent;
            coords: [number, number];
          } => Boolean(item.coords)
        ),
    [events]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const globe = new THREE.Group();
    globeRef.current = globe;
    scene.add(globe);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x17150f,
        metalness: 0.85,
        roughness: 0.32,
        emissive: GOLD,
        emissiveIntensity: 0.08,
      })
    );
    globe.add(sphere);

    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(1.465, 32, 24),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        wireframe: true,
        transparent: true,
        opacity: 0.13,
      })
    );
    globe.add(wireframe);

    const markerGroup = new THREE.Group();
    markerGroupRef.current = markerGroup;
    globe.add(markerGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const goldLight = new THREE.PointLight(0xf5df9b, 65);
    goldLight.position.set(3, 3, 4);
    scene.add(goldLight);

    const sideLight = new THREE.PointLight(0x8b6425, 35);
    sideLight.position.set(-3, -1, 2);
    scene.add(sideLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(markerGroup.children, true);
      const markerHit = hits.find(
        (hit) => hit.object.userData.eventId !== undefined
      );

      if (markerHit) {
        const id = markerHit.object.userData.eventId;
        const found = useStore
          .getState()
          .events.find((item) => item.id === id);

        if (found) setSelected(found);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    let frame = 0;
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      frame += 0.002;
  globe.rotation.y = frame * 0.035;
globe.rotation.x = 0;
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
      renderer.domElement.removeEventListener("click", handleClick);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();

          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
      globeRef.current = null;
      markerGroupRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = markerGroupRef.current;
    if (!group) return;

    group.clear();

    mappedEvents.forEach(({ event, coords }) => {
      const [lat, lon] = coords;
      const position = toVector(lat, lon);
      const color = severityColor(event.severity);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(
          event.severity === "critical" ? 0.04 : 0.026,
          16,
          16
        ),
        new THREE.MeshBasicMaterial({ color })
      );

      marker.position.copy(position);
      marker.userData.eventId = event.id;
      group.add(marker);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.06, 32),
        new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        })
      );

      ring.position.copy(position.clone().multiplyScalar(1.006));
      ring.lookAt(position.clone().multiplyScalar(2));
      ring.userData.eventId = event.id;
      group.add(ring);
    });
  }, [mappedEvents]);

  const criticalCount = mappedEvents.filter(
    ({ event }) =>
      event.severity === "critical" && event.status !== "resolved"
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-900/70">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300">
            FLAMEREX / GLOBAL INTELLIGENCE
          </p>
          <h3 className="mt-2 text-lg font-semibold text-amber-50">
            Global Threat Map
          </h3>
          <p className="mt-1 text-xs text-amber-100/50">
            Events from your dashboard · Approximate country locations
          </p>
        </div>

        <div className="flex gap-4 text-xs">
          <div>
            <p className="text-amber-100/50">Mapped events</p>
            <p className="mt-1 text-xl font-semibold text-amber-200">
              {mappedEvents.length}
            </p>
          </div>
          <div>
            <p className="text-amber-100/50">Unresolved critical</p>
            <p className="mt-1 text-xl font-semibold text-red-400">
              {criticalCount}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,87,0.12),transparent_65%)]" />
        <div ref={mountRef} className="relative z-10 h-[360px] w-full sm:h-[430px]" />
      </div>

      <div className="flex flex-wrap gap-4 border-t border-violet-500/15 px-5 py-3 text-xs text-amber-100/70">
        <span><span className="text-red-400">●</span> Critical</span>
        <span><span className="text-orange-300">●</span> High</span>
        <span><span className="text-amber-200">●</span> Medium</span>
        <span><span className="text-amber-500">●</span> Low</span>
        <span className="text-amber-100/40">Click a marker for event details</span>
      </div>

      {selected && (
        <div className="border-t border-violet-500/20 bg-slate-950/50 p-5 text-sm text-amber-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-amber-400">
                SELECTED SECURITY EVENT
              </p>
              <h4 className="mt-2 font-semibold">{selected.type}</h4>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="rounded-lg border border-amber-500/30 px-3 py-1 text-xs hover:bg-amber-500/10"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-amber-100/45">Country</p>
              <p className="mt-1">{selected.country}</p>
            </div>
            <div>
              <p className="text-xs text-amber-100/45">Source IP</p>
              <p className="mt-1 break-all">{selected.ip}</p>
            </div>
            <div>
              <p className="text-xs text-amber-100/45">Severity</p>
              <p className="mt-1 capitalize">{selected.severity}</p>
            </div>
            <div>
              <p className="text-xs text-amber-100/45">Status</p>
              <p className="mt-1 capitalize">{selected.status}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-amber-100/45">
            Target: {selected.target} · {new Date(selected.time).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}
