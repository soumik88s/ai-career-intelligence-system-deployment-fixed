import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "../context/ThemeContext";

export const Background3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 40;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Create 3D Skill Neural Network Nodes
    const nodeCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    const isDark = themeRef.current === "dark";
    const lightColor1 = new THREE.Color(0x2563eb); // Blue
    const lightColor2 = new THREE.Color(0x059669); // Emerald
    const darkColor1 = new THREE.Color(0x38bdf8);  // Cyan
    const darkColor2 = new THREE.Color(0xa855f7);  // Purple

    for (let i = 0; i < nodeCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const mixedColor = (isDark ? darkColor1 : lightColor1)
        .clone()
        .lerp(isDark ? darkColor2 : lightColor2, Math.random());

      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const pointsMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.65,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    });

    const pointCloud = new THREE.Points(geometry, pointsMaterial);
    scene.add(pointCloud);

    // 5. Connecting Lines (Network Web)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x94a3b8,
      transparent: true,
      opacity: isDark ? 0.25 : 0.18,
    });

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    // Connect close points
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 18) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }

    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const networkLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(networkLines);

    // 6. Floating 3D Geometric Polyhedrons (Career Skill Badges)
    const polyGroup = new THREE.Group();
    const icoGeo = new THREE.IcosahedronGeometry(2.5, 0);
    const octGeo = new THREE.OctahedronGeometry(2, 0);

    const wireMat1 = new THREE.MeshBasicMaterial({
      color: isDark ? 0x10b981 : 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.25,
    });

    const wireMat2 = new THREE.MeshBasicMaterial({
      color: isDark ? 0xa855f7 : 0x059669,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.25,
    });

    const mesh1 = new THREE.Mesh(icoGeo, wireMat1);
    mesh1.position.set(-25, 12, -10);

    const mesh2 = new THREE.Mesh(octGeo, wireMat2);
    mesh2.position.set(28, -15, -15);

    const mesh3 = new THREE.Mesh(icoGeo, wireMat2);
    mesh3.position.set(22, 18, -20);

    polyGroup.add(mesh1, mesh2, mesh3);
    scene.add(polyGroup);

    // 7. Parallax Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.0005;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.0005;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 8. Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // 9. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth rotation
      pointCloud.rotation.y += 0.0008;
      networkLines.rotation.y += 0.0008;

      mesh1.rotation.x += 0.004;
      mesh1.rotation.y += 0.006;
      mesh2.rotation.x -= 0.005;
      mesh2.rotation.z += 0.004;
      mesh3.rotation.y += 0.005;

      // Smooth camera parallax easing
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      camera.position.x = targetX * 30;
      camera.position.y = -targetY * 30;
      camera.lookAt(scene.position);

      // Update theme colors dynamically
      const currentIsDark = themeRef.current === "dark";
      lineMaterial.color.setHex(currentIsDark ? 0x38bdf8 : 0x94a3b8);
      lineMaterial.opacity = currentIsDark ? 0.22 : 0.15;
      pointsMaterial.opacity = currentIsDark ? 0.85 : 0.60;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      geometry.dispose();
      pointsMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      icoGeo.dispose();
      octGeo.dispose();
      wireMat1.dispose();
      wireMat2.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 opacity-60 dark:opacity-80"
      aria-hidden="true"
    />
  );
};
