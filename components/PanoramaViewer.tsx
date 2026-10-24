'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, CircularProgress, Typography, IconButton, Tooltip } from '@mui/material';
import {
  Fullscreen,
  FullscreenExit,
  RotateRight,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  ThreeDRotation
} from '@mui/icons-material';

interface PanoramaViewerProps {
  imageUrl: string;
  height?: number;
  autoRotate?: boolean;
}

export default function PanoramaViewer({
  imageUrl,
  height = 500,
  autoRotate = true
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotate);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>();

  const isUserInteractingRef = useRef(false);
  const onPointerDownMouseXRef = useRef(0);
  const onPointerDownMouseYRef = useRef(0);
  const lonRef = useRef(0);
  const onPointerDownLonRef = useRef(0);
  const latRef = useRef(0);
  const onPointerDownLatRef = useRef(0);
  const phiRef = useRef(0);
  const thetaRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const container = containerRef.current;
    const width = container.clientWidth || 800;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Sphere geometry (inverted normals for interior viewing)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    // Texture loader with cross-origin support
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
      imageUrl,
      (texture) => {
        if (!isMounted) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.error('Failed to load panoramic texture:', err);
        setError('Could not load 360° image. Please verify image source.');
        setLoading(false);
      }
    );

    // Interaction Handlers
    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteractingRef.current = true;
      onPointerDownMouseXRef.current = event.clientX;
      onPointerDownMouseYRef.current = event.clientY;
      onPointerDownLonRef.current = lonRef.current;
      onPointerDownLatRef.current = latRef.current;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      lonRef.current = (onPointerDownMouseXRef.current - event.clientX) * 0.15 + onPointerDownLonRef.current;
      latRef.current = (event.clientY - onPointerDownMouseYRef.current) * 0.15 + onPointerDownLatRef.current;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      isUserInteractingRef.current = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const fov = camera.fov + event.deltaY * 0.05;
      camera.fov = THREE.MathUtils.clamp(fov, 30, 90);
      camera.updateProjectionMatrix();
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (isRotating && !isUserInteractingRef.current) {
        lonRef.current += 0.1;
      }

      latRef.current = Math.max(-85, Math.min(85, latRef.current));
      phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
      thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

      const targetX = 500 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
      const targetY = 500 * Math.cos(phiRef.current);
      const targetZ = 500 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);

      camera.lookAt(targetX, targetY, targetZ);
      renderer.render(scene, camera);
    };

    animate();

    // Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('wheel', onWheel);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      geometry.dispose();
    };
  }, [imageUrl, height, isRotating]);

  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = THREE.MathUtils.clamp(cameraRef.current.fov - 10, 30, 90);
    cameraRef.current.updateProjectionMatrix();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.fov = THREE.MathUtils.clamp(cameraRef.current.fov + 10, 30, 90);
    cameraRef.current.updateProjectionMatrix();
  };

  const handleReset = () => {
    lonRef.current = 0;
    latRef.current = 0;
    if (cameraRef.current) {
      cameraRef.current.fov = 75;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: `${height}px`, bgcolor: '#0f172a', borderRadius: 2, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(15, 23, 42, 0.85)', zIndex: 5
        }}>
          <CircularProgress sx={{ color: '#00ffff', mb: 2 }} />
          <Typography sx={{ color: 'white', fontWeight: 600 }}>Loading 360° Virtual Tour...</Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: 13, mt: 0.5 }}>Click and drag to look around in all directions</Typography>
        </Box>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(15, 23, 42, 0.9)', zIndex: 5, p: 3
        }}>
          <ThreeDRotation sx={{ fontSize: 48, color: '#f43f5e', mb: 1 }} />
          <Typography sx={{ color: 'white', fontWeight: 600 }}>{error}</Typography>
        </Box>
      )}

      {/* 360 Badge */}
      <Box sx={{
        position: 'absolute', top: 16, left: 16,
        bgcolor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
        px: 2, py: 0.75, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, zIndex: 4,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <ThreeDRotation sx={{ color: '#00ffff', fontSize: 20 }} />
        <Typography sx={{ color: 'white', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
          360° INTERACTIVE TOUR
        </Typography>
      </Box>

      {/* Controls Bar */}
      {!loading && !error && (
        <Box sx={{
          position: 'absolute', bottom: 16, right: 16,
          bgcolor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          borderRadius: 2, p: 0.75, display: 'flex', gap: 0.5, zIndex: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut} sx={{ color: '#e2e8f0' }}>
              <ZoomOut fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn} sx={{ color: '#e2e8f0' }}>
              <ZoomIn fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Orientation">
            <IconButton size="small" onClick={handleReset} sx={{ color: '#e2e8f0' }}>
              <CenterFocusStrong fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}>
            <IconButton size="small" onClick={() => setIsRotating(!isRotating)} sx={{ color: isRotating ? '#00ffff' : '#e2e8f0' }}>
              <RotateRight fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#e2e8f0' }}>
              {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
