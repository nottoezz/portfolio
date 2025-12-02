import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function Eye() {
  const eyeRef = React.useRef(null);
  const [ringOffset, setRingOffset] = React.useState({ x: 0, y: 0 });
  const [pupilOffset, setPupilOffset] = React.useState({ x: 0, y: 0 });
  const ringTargetRef = React.useRef({ x: 0, y: 0 });
  const pupilTargetRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (event) => {
      const eye = eyeRef.current;
      if (!eye) return;

      const rect = eye.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // Ring movement range (less than pupil)
      const ringMaxDist = rect.width * 0.15;
      let ringNx = dx;
      let ringNy = dy;
      if (distance > ringMaxDist && distance !== 0) {
        const scale = ringMaxDist / distance;
        ringNx = dx * scale;
        ringNy = dy * scale;
      }

      // Pupil movement range (full range)
      const pupilMaxDist = rect.width * 0.25;
      let pupilNx = dx;
      let pupilNy = dy;
      if (distance > pupilMaxDist && distance !== 0) {
        const scale = pupilMaxDist / distance;
        pupilNx = dx * scale;
        pupilNy = dy * scale;
      }

      // Set target positions
      ringTargetRef.current = { x: ringNx, y: ringNy };
      pupilTargetRef.current = { x: pupilNx, y: pupilNy };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smooth interpolation for rings (more weighted)
  React.useEffect(() => {
    const animateRings = () => {
      setRingOffset((current) => {
        const target = ringTargetRef.current;
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const ease = 0.035; // much slower for heavy movement

        return {
          x: current.x + dx * ease,
          y: current.y + dy * ease,
        };
      });

      requestAnimationFrame(animateRings);
    };

    const animationId = requestAnimationFrame(animateRings);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Smooth interpolation for pupil (more weighted but still responsive)
  React.useEffect(() => {
    const animatePupil = () => {
      setPupilOffset((current) => {
        const target = pupilTargetRef.current;
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const ease = 0.06; // slower for more weight

        return {
          x: current.x + dx * ease,
          y: current.y + dy * ease,
        };
      });

      requestAnimationFrame(animatePupil);
    };

    const animationId = requestAnimationFrame(animatePupil);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      ref={eyeRef}
      className="relative w-96 h-96 -ml-30"
    >
      {/* Outer ring - minimal movement */}
      <div
        className="absolute inset-0 rounded-full border-[3px] border-black bg-black"
        style={{
          transform: `translate(${ringOffset.x * 0.1}px, ${ringOffset.y * 0.1}px)`,
        }}
      />

      {/* Inner ring - follows rings */}
      <div
        className="absolute inset-[28%] rounded-full border-[3px] border-black bg-white"
        style={{
          transform: `translate(${ringOffset.x}px, ${ringOffset.y}px)`,
        }}
      />

      {/* Pupil (blue dot + white highlight) - independent movement */}
      <div
        className="absolute w-6 h-6 rounded-full bg-sky-400 shadow-md"
        style={{
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${pupilOffset.x}px), calc(-50% + ${pupilOffset.y}px))`,
        }}
      >
        <div className="absolute inset-[25%] rounded-full bg-white opacity-90" />
      </div>
    </div>
  );
}

function FlipText({ text, speed = 30, triggerKey }) {
  const [display, setDisplay] = React.useState(() =>
    // initial: just show the text or spaces, up to you
    text || ""
  );

  React.useEffect(() => {
    if (!text) return;

    const targetChars = text.split("");

    const interval = setInterval(() => {
      let finished = false;

      setDisplay((prev) => {
        const prevChars = prev.split("");
        let allDone = true;

        const nextChars = targetChars.map((target, i) => {
          const current = prevChars[i] ?? " ";

          // Non-letters: snap to final immediately
          if (!/[A-Za-z]/.test(target)) return target;

          const isLower = target === target.toLowerCase();
          const alpha = isLower ? ALPHABET.toLowerCase() : ALPHABET;

          // Already at target
          if (current === target) return current;

          allDone = false;

          const idxCurrent = alpha.indexOf(current);
          const idxTarget = alpha.indexOf(target);

          const nextIdx =
            idxCurrent === -1
              ? 0 // if current isn't a letter yet, start at A/a
              : Math.min(idxCurrent + 1, idxTarget);

          return alpha[nextIdx];
        });

        if (allDone) finished = true;
        return nextChars.join("");
      });

      if (finished) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, triggerKey]);

  return <span className="inline-block whitespace-pre-wrap">{display}</span>;
}

function Home() {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0); // for Three.js loop
  const scrollContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const bullets = [
    {
      title: "User-Centric Design",
      body: "Creating intuitive interfaces that prioritize user experience and accessibility.",
    },
    {
      title: "Modern Technologies",
      body: "Building with cutting-edge web technologies and frameworks for optimal performance.",
    },
    {
      title: "Creative Solutions",
      body: "Developing innovative solutions that balance aesthetics with functionality.",
    },
  ];

  // Loading component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-[1000]">
      <div className="relative">
        <div className="w-32 h-32 relative">
          <div className="absolute inset-0 border-4 border-black/20 rounded-full animate-spin" />
          <div className="absolute inset-4 bg-black rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
      </div>
    </div>
  );

  // Asset loading detection
  useEffect(() => {
    const checkAssetsLoaded = async () => {
      const assets = [];

      const fontsLoaded = document.fonts
        ? await document.fonts.ready
        : Promise.resolve();

      const img = new Image();
      img.src = "/film.jpg";
      assets.push(
        new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
      );

      await Promise.all([fontsLoaded, ...assets]);
      setTimeout(() => setIsLoading(false), 2000);
    };

    checkAssetsLoaded();
  }, []);

  // Scroll detection
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const y = el.scrollTop;
      setScrollY(y);
      scrollRef.current = y;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Three.js setup - only run after loading is complete
  useEffect(() => {
    if (isLoading || !mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    camera.position.z = 5;

    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let roseModel = null;
    const loader = new GLTFLoader();

    loader.load(
      "/rose.glb",
      (gltf) => {
        roseModel = gltf.scene;
        roseModel.traverse((child) => {
          if (child.isMesh) {
            const applyMaterial = (material) => {
              material.color.setHex(0x000000);
              material.emissive.setHex(0x111111);
              material.metalness = 0;
              material.roughness = 1;
            };

            if (Array.isArray(child.material)) {
              child.material.forEach(applyMaterial);
            } else if (child.material) {
              applyMaterial(child.material);
            }
          }
        });

        roseModel.scale.set(2, 2, 2);
        roseModel.position.set(2, -3, 0);
        roseModel.rotation.y = Math.PI / 6;
        scene.add(roseModel);
      },
      undefined,
      (error) => {
        console.error("Error loading GLB model:", error);
      }
    );

    const animate = () => {
      requestAnimationFrame(animate);

      if (roseModel) {
        const scrollY = scrollRef.current;

        // First phase: scroll animation (0-100vh)
        const firstPhaseProgress = Math.min(scrollY / window.innerHeight, 1);
        const targetX = 2 - firstPhaseProgress * 5;
        const targetRotationY = Math.PI / 6 + firstPhaseProgress * Math.PI * 1.2;
        const targetRotationX = firstPhaseProgress * 0.6;

        // Second phase: shrinking and centering (150vh+ during second section)
        const secondPhaseStart = window.innerHeight * 1.5;
        const secondPhaseProgress = Math.max(0, Math.min((scrollY - secondPhaseStart) / (window.innerHeight * 1.2), 1));

        // Target center position and extremely small scale
        const centerX = 4;
        const centerY = 0.5; // Slightly higher for perfect centering
        const centerZ = -3; // Bring forward
        const smallScale = 0.15; // Extremely small scale

        // Interpolate between first phase end and second phase target
        const finalX = targetX + (centerX - targetX) * secondPhaseProgress;
        const finalY = -3 + (centerY - (-3)) * secondPhaseProgress;
        const finalZ = 0 + (centerZ - 0) * secondPhaseProgress;
        const finalScale = 2 + (smallScale - 2) * secondPhaseProgress;

        // Spin during transition then settle to hero position
        const spinRotationY = targetRotationY + secondPhaseProgress * Math.PI * 2; // 1 full rotation
        const spinRotationX = targetRotationX + secondPhaseProgress * Math.PI * 0.3; // Reduced X spin
        const heroRotationY = Math.PI / 6; // Final Y rotation (hero position)
        const heroRotationX = 0; // Final X rotation (hero position)

        // Interpolate from spin to final hero position in last 50% of transition
        const settleProgress = Math.max(0, (secondPhaseProgress - 0.5) / 0.5);
        const centerRotationY = spinRotationY + (heroRotationY - spinRotationY) * settleProgress;
        const centerRotationX = spinRotationX + (heroRotationX - spinRotationX) * settleProgress;

        roseModel.position.x += (finalX - roseModel.position.x) * 0.08;
        roseModel.position.y += (finalY - roseModel.position.y) * 0.08;
        roseModel.position.z += (finalZ - roseModel.position.z) * 0.08;

        roseModel.rotation.y += (centerRotationY - roseModel.rotation.y) * 0.08;
        roseModel.rotation.x += (centerRotationX - roseModel.rotation.x) * 0.08;

        roseModel.scale.x += (finalScale - roseModel.scale.x) * 0.05;
        roseModel.scale.y += (finalScale - roseModel.scale.y) * 0.05;
        roseModel.scale.z += (finalScale - roseModel.scale.z) * 0.05;

        // Reduce mouse influence during second phase
        const mouseInfluence = 0.03 * (1 - Math.min(scrollY / (window.innerHeight * 2.7), 1));
        const mouseTargetY =
          roseModel.rotation.y + mouseRef.current.x * mouseInfluence;
        const mouseTargetX =
          roseModel.rotation.x + mouseRef.current.y * mouseInfluence * 0.5;

        roseModel.rotation.y += (mouseTargetY - roseModel.rotation.y) * 0.02;
        roseModel.rotation.x += (mouseTargetX - roseModel.rotation.x) * 0.02;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);

      if (roseModel) {
        scene.remove(roseModel);
        roseModel.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }

      scene.clear();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const textOpacity = Math.max(1 - scrollY / 300, 0);

  return (
    <main
      ref={scrollContainerRef}
      className="
        bg-gray-100 text-gray-900
        overflow-x-hidden
        h-screen
        overflow-y-scroll
        snap-y snap-mandatory
      "
    >
      {/* Film background - static overlay */}
      <div className="film-grain-static" />

      {/* Three.js background */}
      <div
        ref={mountRef}
        className="pointer-events-none fixed right-0 top-0 z-10 overflow-hidden"
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Hero Section */}
      <section className="h-screen relative flex items-center snap-center">
        <div
          className="fixed left-[20vw] top-[50%] -translate-y-1/2 z-[200] transition-all duration-300"
          style={{
            transform: `translateY(calc(-50% + ${-scrollY * 0.5}px))`,
            opacity: textOpacity,
          }}
        >
          <div>
            <h1
              className="text-8xl font-normal text-black leading-none m-0"
              style={{ fontFamily: "Notable, serif" }}
            >
              Liam Birch
            </h1>
            <p
              className="text-xl font-normal text-black opacity-80 my-2 mb-10"
              style={{ fontFamily: "Notable, serif" }}
            >
              UI/UX Designer
            </p>

            <div
              className="fixed left-[47vw] top-[90%] -translate-y-1/2 z-[200] transition-opacity duration-300"
              style={{
                opacity: textOpacity,
                width: "400px",
              }}
            >
              <p
                className="text-base font-normal text-black m-0 text-left opacity-90 whitespace-pre-line"
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  lineHeight: "1.2",
                }}
              >
                Creating experiences{"\n"}that drive action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Section with crescent + fanned bullets + flip board */}
      <section className="h-screen bg-gray-50 flex items-center snap-center">
        <div className="max-w-6xl mx-auto px-8 flex items-center gap-12 w-full">
          {/* Right: animated eye */}
          <div className="w-[400px] flex justify-center ml-auto">
            <Eye />
          </div>

          {/* Left: fanned bullet titles emerging from the moon */}
          <div className="flex-1 max-w-lg">
            <div className="relative h-[500px] flex items-center -ml-24">
              {bullets.map((bullet, index) => {
                // Much bigger vertical spacing + more fan, pushed further left
                const offsetsY = [-100, 0, 100];
                const rotations = [-15, 0, 15];
                const translateX = [-20, 0, -20]; // moved left

                const isActive = index === activeIndex;

                return (
                  <button
                    key={bullet.title}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    className={`
                      absolute left-0 origin-left
                      text-left
                      transition-all duration-300
                      hover:translate-x-1
                      ${
                        isActive
                          ? "opacity-100"
                          : "opacity-70 hover:opacity-100"
                      }
                    `}
                    style={{
                      transform: `
                        translateX(${translateX[index]}px)
                        translateY(${offsetsY[index]}px)
                        rotate(${rotations[index]}deg)
                      `,
                    }}
                  >
                    <span
                      className="block text-sm uppercase tracking-[0.25em] mb-2"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      {`0${index + 1}`}
                    </span>
                    <span
                      className="block text-lg font-medium tracking-wide"
                      style={{ fontFamily: "Notable, serif" }}
                    >
                      {bullet.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center-Right: flip-board detail panel */}
          <div className="flex-1 flex items-center justify-center ml-12 -mr-12">
            <div className=" perspective-1000">
              <div
                className="bg-black text-white rounded-3xl px-10 py-10 shadow-2xl h-96"
              >
                <p
                  className="text-xs uppercase tracking-[0.3em] mb-3 opacity-70"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  {bullets[activeIndex].title}
                </p>

                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "Notable, serif" }}
                >
                  <FlipText
                    text={bullets[activeIndex].title}
                    speed={30}
                    cycles={10}
                    triggerKey={`title-${activeIndex}`}
                  />
                </h3>

                <p className="text-lg leading-relaxed text-gray-200">
                  <FlipText
                    text={bullets[activeIndex].body}
                    speed={20}
                    cycles={14}
                    triggerKey={`body-${activeIndex}`}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rose Focus Section - rose shrinks and centers */}
      <section className="h-screen bg-gray-100 flex items-center justify-center snap-center">
      </section>
    </main>
  );
}

export default Home;
