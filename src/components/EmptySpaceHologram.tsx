import { useEffect, useRef } from "react";
import * as THREE from "three";

type EmptySpaceHologramProps = {
  variant?: "convoy" | "registry" | "overview";
  className?: string;
};

const variantConfig = {
  convoy: {
    accent: 0xccff00,
    secondary: 0x22d3ee,
    cameraZ: 9.5,
    baseRotation: -0.24,
  },
  registry: {
    accent: 0xccff00,
    secondary: 0x8be9ff,
    cameraZ: 10.5,
    baseRotation: 0.14,
  },
  overview: {
    accent: 0xccff00,
    secondary: 0x22d3ee,
    cameraZ: 8.8,
    baseRotation: -0.08,
  },
} as const;

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

function makeTruck(accent: number, secondary: number) {
  const truck = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x101a13,
    emissive: accent,
    emissiveIntensity: 0.14,
    metalness: 0.7,
    roughness: 0.34,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: secondary,
    emissive: secondary,
    emissiveIntensity: 0.42,
    metalness: 0.3,
    roughness: 0.18,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x050707,
    metalness: 0.45,
    roughness: 0.52,
  });

  const trailer = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 1.35), bodyMaterial);
  trailer.position.set(-0.75, 0.3, 0);
  truck.add(trailer);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 1.25), bodyMaterial);
  cab.position.set(2.0, 0.34, 0);
  truck.add(cab);

  const window = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.38, 1.28), glassMaterial);
  window.position.set(2.34, 0.82, 0);
  truck.add(window);

  const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 28);
  [-2.05, -0.75, 1.85].forEach((x) => {
    [-0.72, 0.72].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeometry, tireMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, -0.42, z);
      truck.add(wheel);
    });
  });

  const glow = new THREE.PointLight(accent, 1.6, 7);
  glow.position.set(2.8, 0.4, 0);
  truck.add(glow);

  return truck;
}

function makeRouteLine(accent: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, -1.7, -1.6),
    new THREE.Vector3(-2.2, -1.1, 0.8),
    new THREE.Vector3(-0.3, -1.55, -0.4),
    new THREE.Vector3(1.8, -1.05, 1.1),
    new THREE.Vector3(4.0, -1.42, -1.1),
  ]);

  const geometry = new THREE.TubeGeometry(curve, 96, 0.025, 8, false);
  const material = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.64 });
  return new THREE.Mesh(geometry, material);
}

function makeBeacon(color: number, x: number, z: number) {
  const beacon = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      metalness: 0.25,
      roughness: 0.2,
    })
  );
  beacon.add(core);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.015, 8, 54),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 })
  );
  ring.rotation.x = Math.PI / 2;
  beacon.add(ring);

  beacon.position.set(x, -1.2, z);
  return beacon;
}

export function EmptySpaceHologram({ variant = "convoy", className = "" }: EmptySpaceHologramProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const config = variantConfig[variant];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.55, config.cameraZ);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    mount.appendChild(renderer.domElement);

    const rig = new THREE.Group();
    rig.rotation.x = -0.45;
    rig.rotation.y = config.baseRotation;
    scene.add(rig);

    const ambient = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);

    const grid = new THREE.GridHelper(9, 16, config.accent, config.secondary);
    const gridMaterial = grid.material as THREE.Material | THREE.Material[];
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach((material) => {
        material.transparent = true;
        material.opacity = 0.15;
      });
    } else {
      gridMaterial.transparent = true;
      gridMaterial.opacity = 0.15;
    }
    grid.position.y = -1.85;
    rig.add(grid);

    const route = makeRouteLine(config.accent);
    rig.add(route);

    const primaryTruck = makeTruck(config.accent, config.secondary);
    primaryTruck.scale.setScalar(variant === "overview" ? 0.78 : 0.92);
    primaryTruck.position.set(variant === "registry" ? 1.1 : 0.15, -0.62, 0.12);
    primaryTruck.rotation.y = variant === "registry" ? -0.55 : -0.25;
    rig.add(primaryTruck);

    const satellite = makeTruck(config.secondary, config.accent);
    satellite.scale.setScalar(0.32);
    satellite.position.set(-3.2, -1.0, -1.3);
    satellite.rotation.y = 0.65;
    rig.add(satellite);

    const beacons = [
      makeBeacon(config.accent, -3.4, 1.15),
      makeBeacon(config.secondary, -0.2, -1.58),
      makeBeacon(config.accent, 3.5, 1.35),
    ];
    beacons.forEach((beacon) => rig.add(beacon));

    const scanner = new THREE.Mesh(
      new THREE.TorusGeometry(2.9, 0.018, 8, 96),
      new THREE.MeshBasicMaterial({ color: config.accent, transparent: true, opacity: 0.32 })
    );
    scanner.rotation.x = Math.PI / 2;
    scanner.position.y = -1.78;
    rig.add(scanner);

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let scrollRatio = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
    let responsiveScale = 1;
    let animationId = 0;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      const aspect = width / height;
      const tallContainer = aspect < 0.78;
      responsiveScale = tallContainer ? Math.max(0.48, aspect / 0.78) : 1;
      camera.position.z = config.cameraZ + (tallContainer ? 4.2 : aspect < 1.1 ? 1.2 : 0);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointer = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 2;
      target.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollRatio = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    const animate = (time: number) => {
      const t = time * 0.001;
      pointer.x += (target.x - pointer.x) * 0.055;
      pointer.y += (target.y - pointer.y) * 0.055;

      rig.rotation.y = config.baseRotation + pointer.x * 0.18 + scrollRatio * 0.45;
      rig.rotation.x = -0.45 + pointer.y * 0.12;
      rig.position.y = Math.sin(t * 0.8) * 0.08 + scrollRatio * 0.34;
      rig.scale.setScalar(responsiveScale);
      primaryTruck.rotation.z = Math.sin(t * 1.1) * 0.035;
      primaryTruck.position.y = -0.62 + Math.sin(t * 1.4) * 0.08;
      satellite.position.x = -3.2 + Math.sin(t * 0.8) * 0.65;
      satellite.position.z = -1.3 + Math.cos(t * 0.8) * 0.36;
      route.rotation.y = Math.sin(t * 0.32) * 0.08;
      scanner.rotation.z = t * 0.38;
      scanner.scale.setScalar(1 + Math.sin(t * 1.6) * 0.05);
      beacons.forEach((beacon, index) => {
        beacon.rotation.y = t * (0.7 + index * 0.16);
        beacon.position.y = -1.2 + Math.sin(t * 1.35 + index) * 0.14;
      });

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute select-none opacity-70 mix-blend-screen [mask-image:radial-gradient(ellipse_at_center,black_42%,transparent_76%)] ${className}`}
      aria-hidden="true"
    />
  );
}
