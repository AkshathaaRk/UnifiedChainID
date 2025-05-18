import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check if WebGL is supported
    try {
      const testRenderer = new THREE.WebGLRenderer();
      testRenderer.dispose();
    } catch (e) {
      const warning = document.createElement('div');
      warning.innerHTML = 'WebGL is not supported in your browser';
      canvasRef.current.appendChild(warning);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup with wider field of view for better perspective
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 40;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create a 4D hypercube projection (tesseract) - smaller size
    const createTesseract = () => {
      const group = new THREE.Group();

      // Scale factor to make cubes smaller
      const scale = 0.6;

      // Inner cube - smaller size
      const innerGeometry = new THREE.BoxGeometry(6 * scale, 6 * scale, 6 * scale, 2, 2, 2);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.8,
      });
      const innerCube = new THREE.Mesh(innerGeometry, innerMaterial);
      group.add(innerCube);

      // Outer cube - smaller size
      const outerGeometry = new THREE.BoxGeometry(12 * scale, 12 * scale, 12 * scale, 2, 2, 2);
      const outerMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4,
      });
      const outerCube = new THREE.Mesh(outerGeometry, outerMaterial);
      group.add(outerCube);

      // Create edges for inner cube with rounded corners
      const innerEdges = new THREE.EdgesGeometry(innerGeometry, 15); // Higher threshold for smoother edges
      const innerLinesMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#B026FF'),
        transparent: true,
        opacity: 0.9,
      });
      const innerWireframe = new THREE.LineSegments(innerEdges, innerLinesMaterial);
      group.add(innerWireframe);

      // Create edges for outer cube with rounded corners
      const outerEdges = new THREE.EdgesGeometry(outerGeometry, 15); // Higher threshold for smoother edges
      const outerLinesMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#B026FF'),
        transparent: true,
        opacity: 0.6,
      });
      const outerWireframe = new THREE.LineSegments(outerEdges, outerLinesMaterial);
      group.add(outerWireframe);

      // Connect vertices between inner and outer cubes
      const connectingGeometry = new THREE.BufferGeometry();
      const vertices = [];

      // Define connection points - scaled down
      const innerSize = 3 * scale; // Half the size of inner cube
      const outerSize = 6 * scale; // Half the size of outer cube

      const points = [
        [-innerSize, -innerSize, -innerSize], [innerSize, -innerSize, -innerSize],
        [-innerSize, innerSize, -innerSize], [innerSize, innerSize, -innerSize],
        [-innerSize, -innerSize, innerSize], [innerSize, -innerSize, innerSize],
        [-innerSize, innerSize, innerSize], [innerSize, innerSize, innerSize]
      ];

      points.forEach(([x, y, z]) => {
        vertices.push(x, y, z);
        // Connect to outer cube points
        vertices.push(x/innerSize * outerSize, y/innerSize * outerSize, z/innerSize * outerSize);
      });

      connectingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const connectingLines = new THREE.LineSegments(
        connectingGeometry,
        new THREE.LineBasicMaterial({
          color: new THREE.Color('#B026FF'),
          transparent: true,
          opacity: 0.4,
        })
      );
      group.add(connectingLines);

      // Add invisible mesh for better raycasting (covers the entire tesseract)
      const hitboxGeometry = new THREE.BoxGeometry(12 * scale, 12 * scale, 12 * scale);
      const hitboxMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.userData.isHitbox = true;
      group.add(hitbox);

      // Add user data to track hover state and physics properties
      group.userData = {
        isHovered: false,
        originalMaterials: [],
        glowMaterials: [],
        // Physics properties for collision and bouncing
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,  // Random x velocity
          (Math.random() - 0.5) * 0.2,  // Random y velocity
          (Math.random() - 0.5) * 0.2   // Random z velocity
        ),
        radius: 6 * scale, // Collision radius (half of outer cube size)
        mass: 1 + Math.random() * 0.5,  // Random mass for realistic collisions
        restitution: 0.8 + Math.random() * 0.2  // Bounciness factor (0.8-1.0)
      };

      // Store original materials for later reference
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          const material = child.material as THREE.Material;
          group.userData.originalMaterials.push({
            object: child,
            material: material.clone()
          });

          // Create a glowing version of the material
          if (child instanceof THREE.LineSegments) {
            const glowMaterial = (material as THREE.LineBasicMaterial).clone();
            glowMaterial.color = new THREE.Color('#FF26FF');
            glowMaterial.opacity = 1;
            group.userData.glowMaterials.push({
              object: child,
              material: glowMaterial
            });
          } else if (child instanceof THREE.Mesh && !child.userData.isHitbox) {
            const glowMaterial = (material as THREE.MeshBasicMaterial).clone();
            glowMaterial.color = new THREE.Color('#B026FF');
            glowMaterial.opacity = 0.6;
            group.userData.glowMaterials.push({
              object: child,
              material: glowMaterial
            });
          }
        }
      });

      return group;
    };

    // Create and add tesseracts - more of them with random positions
    const tesseracts = [];
    const numTesseracts = 12; // Increased number of tesseracts

    // Define boundaries for positioning
    const bounds = {
      minX: -40, maxX: 40,
      minY: -20, maxY: 30,
      minZ: -30, maxZ: 10
    };

    // Create tesseracts with random positions
    for (let i = 0; i < numTesseracts; i++) {
      const tesseract = createTesseract();

      // Random position within bounds
      tesseract.position.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      tesseract.position.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      tesseract.position.z = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);

      // Random initial rotation
      tesseract.rotation.x = Math.random() * Math.PI * 2;
      tesseract.rotation.y = Math.random() * Math.PI * 2;
      tesseract.rotation.z = Math.random() * Math.PI * 2;

      scene.add(tesseract);
      tesseracts.push(tesseract);
    }

    // Track mouse position for parallax effect and raycasting
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    const raycaster = new THREE.Raycaster();
    const mousePosition = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
      // Update for parallax effect
      mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = (event.clientY / window.innerHeight) * 2 - 1;

      // Update for raycasting
      mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Function to apply glow effect
    const applyGlowEffect = (tesseract: THREE.Group, isGlowing: boolean) => {
      if (isGlowing) {
        // Apply glow materials
        tesseract.userData.glowMaterials.forEach(({ object, material }) => {
          object.material = material;
        });

        // Change color and opacity for meshes
        tesseract.children.forEach(child => {
          if (child instanceof THREE.Mesh && !child.userData.isHitbox) {
            const material = child.material as THREE.MeshBasicMaterial;
            material.color = new THREE.Color('#B026FF');
            material.opacity = 0.6;
          }
        });
      } else {
        // Restore original materials
        tesseract.userData.originalMaterials.forEach(({ object, material }) => {
          object.material = material.clone();
        });
      }
    };

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse movement
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Update raycaster
      raycaster.setFromCamera(mousePosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      // Check for hover on tesseracts
      tesseracts.forEach((tesseract) => {
        // Check if this tesseract is being hovered
        const isHovered = intersects.some(intersect => {
          let currentObj = intersect.object;
          while (currentObj.parent) {
            if (currentObj === tesseract) return true;
            currentObj = currentObj.parent;
          }
          return false;
        });

        // Update hover state if changed
        if (isHovered !== tesseract.userData.isHovered) {
          tesseract.userData.isHovered = isHovered;
          applyGlowEffect(tesseract, isHovered);
        }

        // Rotation based on mouse position and time
        tesseract.rotation.x += 0.005 + mouse.y * 0.01;
        tesseract.rotation.y += 0.007 + mouse.x * 0.01;
        tesseract.rotation.z += 0.003;

        // Apply velocity to position (physics-based movement)
        tesseract.position.x += tesseract.userData.velocity.x;
        tesseract.position.y += tesseract.userData.velocity.y;
        tesseract.position.z += tesseract.userData.velocity.z;

        // Boundary collision detection and bounce
        if (tesseract.position.x < bounds.minX + tesseract.userData.radius) {
          tesseract.position.x = bounds.minX + tesseract.userData.radius;
          tesseract.userData.velocity.x *= -tesseract.userData.restitution;
        } else if (tesseract.position.x > bounds.maxX - tesseract.userData.radius) {
          tesseract.position.x = bounds.maxX - tesseract.userData.radius;
          tesseract.userData.velocity.x *= -tesseract.userData.restitution;
        }

        if (tesseract.position.y < bounds.minY + tesseract.userData.radius) {
          tesseract.position.y = bounds.minY + tesseract.userData.radius;
          tesseract.userData.velocity.y *= -tesseract.userData.restitution;
        } else if (tesseract.position.y > bounds.maxY - tesseract.userData.radius) {
          tesseract.position.y = bounds.maxY - tesseract.userData.radius;
          tesseract.userData.velocity.y *= -tesseract.userData.restitution;
        }

        if (tesseract.position.z < bounds.minZ + tesseract.userData.radius) {
          tesseract.position.z = bounds.minZ + tesseract.userData.radius;
          tesseract.userData.velocity.z *= -tesseract.userData.restitution;
        } else if (tesseract.position.z > bounds.maxZ - tesseract.userData.radius) {
          tesseract.position.z = bounds.maxZ - tesseract.userData.radius;
          tesseract.userData.velocity.z *= -tesseract.userData.restitution;
        }

        // Pulse effect on edges (only if not hovered)
        if (!tesseract.userData.isHovered) {
          tesseract.children.forEach((child) => {
            if (child instanceof THREE.LineSegments) {
              const material = child.material as THREE.LineBasicMaterial;
              const pulseIntensity = (Math.sin(elapsedTime * 2 + tesseracts.indexOf(tesseract)) * 0.3 + 0.7);
              material.opacity = pulseIntensity;
            }
          });
        } else {
          // If hovered, make the tesseract pulse with a stronger glow
          const glowIntensity = (Math.sin(elapsedTime * 4) * 0.2 + 0.8);
          tesseract.children.forEach((child) => {
            if (child instanceof THREE.LineSegments) {
              const material = child.material as THREE.LineBasicMaterial;
              material.opacity = glowIntensity;
            }
          });
        }
      });

      // Check for collisions between tesseracts
      for (let i = 0; i < tesseracts.length; i++) {
        for (let j = i + 1; j < tesseracts.length; j++) {
          const tesseract1 = tesseracts[i];
          const tesseract2 = tesseracts[j];

          // Calculate distance between tesseracts
          const distance = tesseract1.position.distanceTo(tesseract2.position);
          const minDistance = tesseract1.userData.radius + tesseract2.userData.radius;

          // If collision detected
          if (distance < minDistance) {
            // Calculate collision normal
            const normal = new THREE.Vector3()
              .subVectors(tesseract2.position, tesseract1.position)
              .normalize();

            // Calculate relative velocity
            const relativeVelocity = new THREE.Vector3()
              .subVectors(tesseract2.userData.velocity, tesseract1.userData.velocity);

            // Calculate relative velocity along normal
            const velocityAlongNormal = relativeVelocity.dot(normal);

            // Skip if objects are moving away from each other
            if (velocityAlongNormal > 0) continue;

            // Calculate restitution (bounciness)
            const restitution = Math.min(
              tesseract1.userData.restitution,
              tesseract2.userData.restitution
            );

            // Calculate impulse scalar
            const impulseMagnitude = -(1 + restitution) * velocityAlongNormal /
              (1/tesseract1.userData.mass + 1/tesseract2.userData.mass);

            // Apply impulse
            const impulse = normal.clone().multiplyScalar(impulseMagnitude);

            tesseract1.userData.velocity.sub(
              impulse.clone().multiplyScalar(1 / tesseract1.userData.mass)
            );

            tesseract2.userData.velocity.add(
              impulse.clone().multiplyScalar(1 / tesseract2.userData.mass)
            );

            // Separate the tesseracts to prevent sticking
            const overlap = minDistance - distance;
            const separationVector = normal.clone().multiplyScalar(overlap * 0.5);

            tesseract1.position.sub(separationVector);
            tesseract2.position.add(separationVector);

            // Add a small random factor to prevent perfect symmetry
            tesseract1.userData.velocity.add(new THREE.Vector3(
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01,
              (Math.random() - 0.5) * 0.01
            ));

            // Flash the colliding tesseracts briefly
            const flashDuration = 0.2;
            const flashIntensity = 1.2;

            tesseract1.children.forEach(child => {
              if (child instanceof THREE.LineSegments) {
                const material = child.material as THREE.LineBasicMaterial;
                material.opacity = flashIntensity;

                // Reset opacity after flash duration
                setTimeout(() => {
                  if (material && !tesseract1.userData.isHovered) {
                    material.opacity = 0.7;
                  }
                }, flashDuration * 1000);
              }
            });

            tesseract2.children.forEach(child => {
              if (child instanceof THREE.LineSegments) {
                const material = child.material as THREE.LineBasicMaterial;
                material.opacity = flashIntensity;

                // Reset opacity after flash duration
                setTimeout(() => {
                  if (material && !tesseract2.userData.isHovered) {
                    material.opacity = 0.7;
                  }
                }, flashDuration * 1000);
              }
            });
          }
        }
      }

      // Render scene
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', () => {});

      if (canvasRef.current) {
        canvasRef.current.removeChild(renderer.domElement);
      }

      // Dispose of resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  return <div ref={canvasRef} className="canvas-container bg-uc-black" />;
};

export default ThreeBackground;