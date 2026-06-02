import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Cinematic Three.js hero: a floating, slowly-rotating torus-knot "energy core"
 * with perspective mouse parallax, a specular shine sweep, and a gentle camera
 * dolly. Pure Three.js (no react-three-fiber) to honour the brief.
 */
export function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Geometry: an energy core.
    const geometry = new THREE.TorusKnotGeometry(1.1, 0.34, 220, 32);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#7c5cff"),
      metalness: 0.9,
      roughness: 0.15,
      emissive: new THREE.Color("#1b1140"),
      emissiveIntensity: 0.6,
    });
    const knot = new THREE.Mesh(geometry, material);
    scene.add(knot);

    // Wireframe halo.
    const halo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.4, 1),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#22d3ee"),
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      })
    );
    scene.add(halo);

    // Lights — including a moving "shine" light for the specular sweep.
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const keyLight = new THREE.PointLight(0x7c5cff, 60, 50);
    keyLight.position.set(4, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x22d3ee, 40, 50);
    rimLight.position.set(-5, -2, 3);
    scene.add(rimLight);
    const shine = new THREE.PointLight(0xffffff, 30, 30);
    scene.add(shine);

    // Particle field.
    const starGeo = new THREE.BufferGeometry();
    const starCount = 320;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 18;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.6 })
    );
    scene.add(stars);

    // Mouse parallax.
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer);

    const clock = new THREE.Clock();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!prefersReduced) {
        knot.rotation.x = t * 0.18;
        knot.rotation.y = t * 0.26;
        halo.rotation.y = -t * 0.08;
        knot.position.y = Math.sin(t * 0.8) * 0.12;

        // Specular shine sweep.
        shine.position.set(Math.sin(t * 0.9) * 5, Math.cos(t * 0.7) * 4, 4);

        // Smooth parallax toward the pointer.
        target.x += (mouse.x - target.x) * 0.05;
        target.y += (mouse.y - target.y) * 0.05;
        camera.position.x = target.x * 0.8;
        camera.position.y = -target.y * 0.6;
        // Subtle dolly.
        camera.position.z = 6 + Math.sin(t * 0.4) * 0.3;
        camera.lookAt(0, 0, 0);

        stars.rotation.y = t * 0.02;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 -z-0" aria-hidden="true" />;
}
