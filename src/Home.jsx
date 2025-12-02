import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      scrollRef.current = y;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        const scrollProgress = Math.min(scrollRef.current / 400, 1);

        const targetX = 2 - scrollProgress * 5;
        const targetRotationY = Math.PI / 6 + scrollProgress * Math.PI * 1.2;
        const targetRotationX = scrollProgress * 0.6;

        roseModel.position.x += (targetX - roseModel.position.x) * 0.08;
        roseModel.rotation.y += (targetRotationY - roseModel.rotation.y) * 0.08;
        roseModel.rotation.x += (targetRotationX - roseModel.rotation.x) * 0.08;

        const mouseInfluence = 0.05 * (1 - scrollProgress);
        const mouseTargetY =
          roseModel.rotation.y + mouseRef.current.x * mouseInfluence;
        const mouseTargetX =
          roseModel.rotation.x + mouseRef.current.y * mouseInfluence * 0.5;

        roseModel.rotation.y += (mouseTargetY - roseModel.rotation.y) * 0.03;
        roseModel.rotation.x += (mouseTargetX - roseModel.rotation.x) * 0.03;
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
    <main className="bg-gray-100 text-gray-900 overflow-x-hidden">
      {/* Film background - static overlay */}
      <div className="film-grain-static" />

      {/* Three.js background */}
      <div
        ref={mountRef}
        className="pointer-events-none fixed right-0 top-0 z-10 overflow-hidden"
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center">
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
      <section className="min-h-screen bg-gray-50 flex items-center">
        <div className="max-w-6xl mx-auto px-8 flex items-center gap-12 w-full">
          {/* Right: crescent moon – much bigger, slimmer, no inner circle */}
          <div className="w-[400px] flex justify-center ml-auto">
            <div className="relative w-96 h-96 -ml-30">
              {/* Thin outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-black/40" />
            </div>
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
    </main>
  );
}

export default Home;
