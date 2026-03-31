'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, CircularProgress, Typography, IconButton, Alert, Button } from '@mui/material';
import { Fullscreen, FullscreenExit, RotateLeft, RotateRight, CenterFocusStrong, ZoomIn, ZoomOut } from '@mui/icons-material';

interface ThreeViewerProps {
  modelUrl: string;
  modelFormat?: string;
  width?: string | number;
  height?: number;
  autoRotate?: boolean;
}

const ThreeViewer: React.FC<ThreeViewerProps> = ({ 
  modelUrl, 
  modelFormat = 'glb', 
  width = '100%', 
  height = 500,
  autoRotate = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationRef = useRef<number>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(autoRotate);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initThree = async () => {
      try {
        const OrbitControlsModule = await import('three/addons/controls/OrbitControls.js');
        const GLTFLoaderModule = await import('three/addons/loaders/GLTFLoader.js');
        const DRACOLoaderModule = await import('three/addons/loaders/DRACOLoader.js');
        
        const OrbitControls = OrbitControlsModule.OrbitControls;
        const GLTFLoader = GLTFLoaderModule.GLTFLoader;
        const DRACOLoader = DRACOLoaderModule.DRACOLoader;

        if (!mounted || !containerRef.current) return;

        const container = containerRef.current;
        
        // Get exact dimensions
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const containerHeight = height;

        console.log('Container dimensions:', containerWidth, 'x', containerHeight);

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        sceneRef.current = scene;

        // Camera - KEEP YOUR WORKING POSITION
        const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 1000);
        camera.position.set(2, 1.5, 3);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerWidth, containerHeight);
        renderer.setClearColor(0xffffff);
        renderer.shadowMap.enabled = true;
        
        // Clear previous content
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = isAutoRotate;
        controls.autoRotateSpeed = 1.5;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.zoomSpeed = 1.2;
        controls.target.set(0, 0, 0);
        controlsRef.current = controls;
1.
        // Setup DRACOLoader
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
        dracoLoader.setDecoderConfig({ type: 'js' });

        // Setup GLTFLoader with DRACOLoader
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        scene.add(mainLight);

        const fillLight = new THREE.PointLight(0xffaa66, 0.5);
        fillLight.position.set(2, 3, 4);
        scene.add(fillLight);

        const backLight = new THREE.PointLight(0x88aaff, 0.3);
        backLight.position.set(-2, 1, -3);
        scene.add(backLight);

        // Helper grid (optional)
        const gridHelper = new THREE.GridHelper(8, 20, 0x88aaff, 0x335588);
        gridHelper.position.y = -1;
        scene.add(gridHelper);

        // Load model
        const loadModel = async () => {
          try {
            setLoading(true);
            
            console.log('Loading model with DRACO support...');
            
            const gltf = await gltfLoader.loadAsync(modelUrl);
            const modelObject = gltf.scene;
            
            console.log('Model loaded successfully, children:', modelObject.children.length);
            
            // Calculate bounds
            const box = new THREE.Box3().setFromObject(modelObject);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            console.log('Model size:', size.x, size.y, size.z);
            
            // Scale to fit (keep your scaling logic)
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 300 / maxDim;
            modelObject.scale.set(scale, scale, scale);
            
            // Center - KEEP YOUR WORKING POSITIONING
            const scaledCenter = center.clone().multiplyScalar(scale);
            modelObject.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);
            
            scene.add(modelObject);
            modelRef.current = modelObject;
            
            // Adjust camera - KEEP YOUR WORKING POSITION
            const distance = maxDim * 1.5;
            camera.position.set(distance, distance * 0.7, distance);
            controls.target.set(0, 0, 0);
            controls.update();
            
            console.log('Model positioned successfully');
            
          } catch (err) {
            console.error('Error loading model:', err);
            setError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);
            
            // Add fallback cube
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ color: 0xff6600 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);
            modelRef.current = cube;
            camera.position.set(2, 1.5, 3);
            controls.target.set(0, 0, 0);
            controls.update();
          } finally {
            if (mounted) setLoading(false);
          }
        };

        await loadModel();

        // Animation
        const animate = () => {
          animationRef.current = requestAnimationFrame(animate);
          if (controlsRef.current) controlsRef.current.update();
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        };
        animate();

        // Handle resize
        const handleResize = () => {
          if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
          const newRect = containerRef.current.getBoundingClientRect();
          const newWidth = newRect.width;
          const newHeight = height;
          
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        };
        
        window.addEventListener('resize', handleResize);

        return () => {
          mounted = false;
          window.removeEventListener('resize', handleResize);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          if (controlsRef.current) controlsRef.current.dispose();
          if (rendererRef.current && container) {
            rendererRef.current.dispose();
            if (container.contains(rendererRef.current.domElement)) {
              container.removeChild(rendererRef.current.domElement);
            }
          }
          if (sceneRef.current) sceneRef.current.clear();
        };
        
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to initialize 3D viewer');
        setLoading(false);
      }
    };

    initThree();
  }, [modelUrl, height, isAutoRotate]);

  const zoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      const direction = cameraRef.current.position.clone().normalize();
      const newPos = cameraRef.current.position.clone().sub(direction.multiplyScalar(0.3));
      cameraRef.current.position.copy(newPos);
      controlsRef.current.update();
    }
  };

  const zoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      const direction = cameraRef.current.position.clone().normalize();
      const newPos = cameraRef.current.position.clone().add(direction.multiplyScalar(0.3));
      cameraRef.current.position.copy(newPos);
      controlsRef.current.update();
    }
  };

  const resetView = () => {
    if (modelRef.current && cameraRef.current && controlsRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim > 0 ? maxDim * 1.5 : 2.5;
      cameraRef.current.position.set(distance, distance * 0.7, distance);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      setIsAutoRotate(!isAutoRotate);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: `${height}px`,
      minHeight: `${height}px`,
      overflow: 'hidden'
    }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative',
          backgroundColor: '#111827'
        }} 
      />
      
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)', 
          borderRadius: 2,
          padding: 2,
          zIndex: 10
        }}>
          <CircularProgress sx={{ color: '#00ffff' }} />
          <Typography sx={{ color: 'white', ml: 2 }}>Loading 3D Model...</Typography>
        </Box>
      )}
      
      {error && !loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          backgroundColor: 'rgba(0,0,0,0.9)', 
          borderRadius: 2,
          padding: 3,
          zIndex: 10,
          maxWidth: '90%'
        }}>
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => window.location.reload()}
            sx={{ color: '#00ffff', borderColor: '#00ffff' }}
          >
            Retry
          </Button>
        </Box>
      )}
      
      {!loading && !error && (
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          right: 16, 
          display: 'flex', 
          gap: 1,
          backgroundColor: 'rgba(0,0,0,0.6)', 
          borderRadius: 2, 
          p: 0.5, 
          zIndex: 10
        }}>
          <IconButton size="small" onClick={zoomOut} sx={{ color: '#fff' }} title="Zoom Out"><ZoomOut fontSize="small" /></IconButton>
          <IconButton size="small" onClick={zoomIn} sx={{ color: '#fff' }} title="Zoom In"><ZoomIn fontSize="small" /></IconButton>
          <IconButton size="small" onClick={resetView} sx={{ color: '#fff' }} title="Reset View"><CenterFocusStrong fontSize="small" /></IconButton>
          <IconButton size="small" onClick={toggleAutoRotate} sx={{ color: isAutoRotate ? '#00ffff' : '#fff' }} title="Auto Rotate"><RotateRight fontSize="small" /></IconButton>
          <IconButton size="small" onClick={toggleFullscreen} sx={{ color: '#fff' }} title="Fullscreen">{isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}</IconButton>
        </Box>
      )}
    </Box>
  );
};

export default ThreeViewer;