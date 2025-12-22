import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/models/Earth.glb';

const EarthMesh = () => {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={15} />
    </group>
  );
};

useGLTF.preload(MODEL_PATH);

export const EarthCanvas = () => {
  return (
    <div className="w-full h-full">
      <Canvas 
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ alpha: true }}  // ← 透過を有効化
        flat 
        camera={{ 
          position: [0, 0, 25],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={8.0} /> 
        <Environment preset="city" />
        <EarthMesh />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>
    </div>
  );
};
