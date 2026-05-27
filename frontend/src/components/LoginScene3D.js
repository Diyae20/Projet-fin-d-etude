import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const LoginScene3D = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* ---------- Renderer ---------- */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    /* ---------- Scene & camera ---------- */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06121f, 0.045);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    /* ---------- Lights ---------- */
    const hemi = new THREE.HemisphereLight(0x7ee9d8, 0x06121f, 0.55);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimTeal = new THREE.PointLight(0x4fd1be, 2.4, 18, 2);
    rimTeal.position.set(-4, 2, 3);
    scene.add(rimTeal);

    const rimAzure = new THREE.PointLight(0x4f8cff, 1.8, 18, 2);
    rimAzure.position.set(5, -2, 2);
    scene.add(rimAzure);

    /* ---------- Center group (medical cross) ---------- */
    const centerGroup = new THREE.Group();
    scene.add(centerGroup);

    function buildMedicalCross() {
      const group = new THREE.Group();

      const shape = new THREE.Shape();
      const r = 0.18;
      const a = 1.6;
      const b = 0.55;
      roundedCrossPath(shape, a, b, r);

      const extrudeSettings = {
        depth: 0.42,
        bevelEnabled: true,
        bevelSegments: 6,
        steps: 1,
        bevelSize: 0.06,
        bevelThickness: 0.06,
        curveSegments: 24,
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.center();

      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xeafffb,
        metalness: 0.15,
        roughness: 0.15,
        transmission: 0.85,
        thickness: 0.6,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        attenuationColor: new THREE.Color(0x7ee9d8),
        attenuationDistance: 1.4,
        envMapIntensity: 1.2,
      });

      const cross = new THREE.Mesh(geo, mat);
      group.add(cross);

      const haloGeo = new THREE.RingGeometry(1.4, 1.55, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x7ee9d8,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.z = -0.3;
      group.add(halo);

      const coreGeo = new THREE.SphereGeometry(0.12, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xeafffb });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.z = 0.3;
      group.add(core);

      return { group, cross, halo, core };
    }

    function roundedCrossPath(shape, a, b, r) {
      const A = a, B = b;
      const pts = [
        [ B,  A], [-B,  A],
        [-B,  B], [-A,  B],
        [-A, -B], [-B, -B],
        [-B, -A], [ B, -A],
        [ B, -B], [ A, -B],
        [ A,  B], [ B,  B],
      ];
      shape.moveTo(pts[0][0], pts[0][1] - r);
      for (let i = 0; i < pts.length; i++) {
        const cur  = pts[i];
        const next = pts[(i + 1) % pts.length];
        shape.lineTo(cur[0], cur[1]);
        const mx = (cur[0] + next[0]) / 2;
        const my = (cur[1] + next[1]) / 2;
        shape.quadraticCurveTo(cur[0], cur[1], mx, my);
      }
      shape.closePath();
    }

    const { group: crossGroup, cross, halo, core } = buildMedicalCross();
    crossGroup.position.set(0.4, 0.2, 0);
    crossGroup.rotation.set(-0.15, -0.25, 0.05);
    centerGroup.add(crossGroup);

    /* ---------- Orbital rings ---------- */
    const ringsGroup = new THREE.Group();
    centerGroup.add(ringsGroup);

    function makeRing(radius, tube, color, opacity) {
      const g = new THREE.TorusGeometry(radius, tube, 24, 160);
      const m = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
      });
      return new THREE.Mesh(g, m);
    }
    const ring1 = makeRing(2.4, 0.006, 0x7ee9d8, 0.55);
    ring1.rotation.x = Math.PI / 2.2;
    ringsGroup.add(ring1);

    const ring2 = makeRing(2.8, 0.005, 0x8fb8ff, 0.4);
    ring2.rotation.x = Math.PI / 2.6;
    ring2.rotation.y = 0.6;
    ringsGroup.add(ring2);

    const ring3 = makeRing(3.3, 0.004, 0x7ee9d8, 0.22);
    ring3.rotation.x = Math.PI / 2;
    ring3.rotation.z = 0.4;
    ringsGroup.add(ring3);

    function addDotOnRing(ring, radius, angle, color) {
      const g = new THREE.SphereGeometry(0.04, 16, 16);
      const m = new THREE.MeshBasicMaterial({ color });
      const dot = new THREE.Mesh(g, m);
      dot.userData.ring = ring;
      dot.userData.radius = radius;
      dot.userData.angle = angle;
      dot.userData.speed = 0.0015 + Math.random() * 0.0015;
      ringsGroup.add(dot);
      return dot;
    }
    const dots = [];
    for (let i = 0; i < 5; i++) dots.push(addDotOnRing(ring1, 2.4, Math.random() * Math.PI * 2, 0xeafffb));
    for (let i = 0; i < 4; i++) dots.push(addDotOnRing(ring2, 2.8, Math.random() * Math.PI * 2, 0x8fb8ff));
    for (let i = 0; i < 3; i++) dots.push(addDotOnRing(ring3, 3.3, Math.random() * Math.PI * 2, 0x7ee9d8));

    /* ---------- DNA double helix ---------- */
    const dnaGroup = new THREE.Group();
    dnaGroup.position.set(-3.6, 0, -3);
    dnaGroup.rotation.z = 0.15;
    scene.add(dnaGroup);

    const dnaHeight = 8;
    const dnaTurns = 3;
    const dnaSegments = 60;
    const dnaRadius = 0.55;

    const sphereGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const sphereMatA = new THREE.MeshBasicMaterial({ color: 0x7ee9d8, transparent: true, opacity: 0.85 });
    const sphereMatB = new THREE.MeshBasicMaterial({ color: 0x8fb8ff, transparent: true, opacity: 0.85 });
    const rungMat = new THREE.LineBasicMaterial({ color: 0x4fd1be, transparent: true, opacity: 0.25 });

    for (let i = 0; i < dnaSegments; i++) {
      const t = i / (dnaSegments - 1);
      const y = (t - 0.5) * dnaHeight;
      const angle = t * Math.PI * 2 * dnaTurns;

      const x1 = Math.cos(angle) * dnaRadius;
      const z1 = Math.sin(angle) * dnaRadius;
      const x2 = Math.cos(angle + Math.PI) * dnaRadius;
      const z2 = Math.sin(angle + Math.PI) * dnaRadius;

      const a = new THREE.Mesh(sphereGeo, sphereMatA);
      a.position.set(x1, y, z1);
      dnaGroup.add(a);

      const b = new THREE.Mesh(sphereGeo, sphereMatB);
      b.position.set(x2, y, z2);
      dnaGroup.add(b);

      if (i % 3 === 0) {
        const geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1, y, z1),
          new THREE.Vector3(x2, y, z2),
        ]);
        const line = new THREE.Line(geom, rungMat);
        dnaGroup.add(line);
      }
    }

    /* ---------- Particle cloud ---------- */
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
      speeds[i] = 0.0008 + Math.random() * 0.0015;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xc8f4ec,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ---------- Mouse parallax ---------- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouse.tx = (e.clientX / w - 0.5) * 2;
      mouse.ty = (e.clientY / h - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    /* ---------- Resize ---------- */
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------- Animation loop ---------- */
    const clock = new THREE.Clock();
    let animId;
    function animate() {
      const t = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      camera.position.x = mouse.x * 0.6;
      camera.position.y = -mouse.y * 0.4;
      camera.lookAt(0, 0, 0);

      crossGroup.position.y = 0.2 + Math.sin(t * 0.8) * 0.18;
      crossGroup.rotation.y = -0.25 + Math.sin(t * 0.4) * 0.35;
      crossGroup.rotation.x = -0.15 + Math.cos(t * 0.5) * 0.12;

      halo.rotation.z = t * 0.3;
      halo.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);

      const pulse = 1 + Math.sin(t * 2.2) * 0.25;
      core.scale.setScalar(pulse);
      core.material.opacity = 0.7 + Math.sin(t * 2.2) * 0.3;

      ring1.rotation.z = t * 0.10;
      ring2.rotation.z = -t * 0.07;
      ring3.rotation.z = t * 0.05;

      dots.forEach((d) => {
        d.userData.angle += d.userData.speed;
        const r = d.userData.radius;
        const a = d.userData.angle;
        const ring = d.userData.ring;
        d.position.set(
          Math.cos(a) * r,
          Math.sin(a) * r * Math.cos(ring.rotation.x),
          Math.sin(a) * r * Math.sin(ring.rotation.x)
        );
      });

      dnaGroup.rotation.y = t * 0.25;

      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3 + 1] += speeds[i];
        if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -5;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = t * 0.02;

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    }

    requestAnimationFrame(() => {
      resize();
      animate();
    });

    /* ---------- Cleanup ---------- */
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <canvas ref={canvasRef} className="scene-canvas" aria-hidden="true" />;
};

export default LoginScene3D;
