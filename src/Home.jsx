import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const ROSE_KEYFRAMES = [
  {
    // Section 0 – hero (start)
    position: { x: 2, y: -3, z: 0 },
    rotation: { x: 0, y: Math.PI / 6, z: 0 },
    scale: 2,
  },
  {
    // Section 1 – eye / bullets
    position: { x: -3.15, y: -1, z: 0 },
    rotation: { x: 0.2, y: Math.PI * 0.1, z: 0 },
    scale: 0.7,
  },
  {
    // Section 2 – final tiny focus
    position: { x: 0, y: -4, z: -3 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: 2,
  },
];

// Given scrollY, return interpolated pose between keyframes
function getRosePoseFromScroll(scrollY) {
  const h = window.innerHeight || 1;

  // 0–1 => between keyframe 0 & 1
  // 1–2 => between keyframe 1 & 2
  const sectionFloat = scrollY / h;
  const idx = Math.floor(sectionFloat);
  const tRaw = sectionFloat - idx;
  const t = Math.min(Math.max(tRaw, 0), 1);

  const last = ROSE_KEYFRAMES[ROSE_KEYFRAMES.length - 1];
  const from = ROSE_KEYFRAMES[idx] || last;
  const to = ROSE_KEYFRAMES[idx + 1] || last;

  const lerp = (a, b) => a + (b - a) * t;

  return {
    position: {
      x: lerp(from.position.x, to.position.x),
      y: lerp(from.position.y, to.position.y),
      z: lerp(from.position.z, to.position.z),
    },
    rotation: {
      x: lerp(from.rotation.x, to.rotation.x),
      y: lerp(from.rotation.y, to.rotation.y),
      z: lerp(from.rotation.z, to.rotation.z),
    },
    scale: lerp(from.scale, to.scale),
  };
}

function Eye({ progress = 0 }) {
  const circumference = 2 * Math.PI * 144; // radius = (384px - 16px border)/2 = 184px, but using 144 for visual appeal
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="w-96 h-96 -ml-30 relative">
      <svg
        width="384"
        height="384"
        viewBox="0 0 384 384"
        className="absolute inset-0"
      >
        <circle
          cx="192"
          cy="192"
          r="144"
          fill="none"
          stroke="black"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  );
}

function TypingText({ text, speed = 50, trigger = false, cursor = true }) {
  const [displayText, setDisplayText] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(false);

  React.useEffect(() => {
    if (!trigger) {
      setDisplayText('');
      setShowCursor(false);
      return;
    }

    setShowCursor(true);
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Keep cursor for a moment after typing completes
        setTimeout(() => setShowCursor(false), 500);
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed, trigger]);

  return (
    <span className="inline-block">
      {displayText}
      {showCursor && cursor && (
        <span className="animate-pulse text-black">|</span>
      )}
    </span>
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
  const [eyeProgress, setEyeProgress] = useState(0);
  const [roseSettled, setRoseSettled] = useState(false);
  const [bulletsVisible, setBulletsVisible] = useState(false);
  const [typingStates, setTypingStates] = useState([false, false, false]);

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
    if (isLoading) return; // wait until main is on screen

    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const y = el.scrollTop;
      setScrollY(y);
      scrollRef.current = y;
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isLoading]);

  // Eye animation trigger when rose settles in eye section
  useEffect(() => {
    const h = window.innerHeight || 1;
    const sectionFloat = scrollY / h;

    // Check if we're in the eye section (around section 1)
    const inEyeSection = sectionFloat > 0.7 && sectionFloat < 1.3;

    if (inEyeSection) {
      // Calculate how close the rose is to its target position
      const eyeKeyframe = ROSE_KEYFRAMES[1];
      const currentPose = getRosePoseFromScroll(scrollY);

      // Calculate distance from current pose to target pose
      const posDiff = Math.sqrt(
        Math.pow(currentPose.position.x - eyeKeyframe.position.x, 2) +
        Math.pow(currentPose.position.y - eyeKeyframe.position.y, 2) +
        Math.pow(currentPose.position.z - eyeKeyframe.position.z, 2)
      );

      const rotDiff = Math.sqrt(
        Math.pow(currentPose.rotation.x - eyeKeyframe.rotation.x, 2) +
        Math.pow(currentPose.rotation.y - eyeKeyframe.rotation.y, 2) +
        Math.pow(currentPose.rotation.z - eyeKeyframe.rotation.z, 2)
      );

      const scaleDiff = Math.abs(currentPose.scale - eyeKeyframe.scale);

      // If rose is close to settled (within thresholds), start eye animation
      const settledThreshold = 0.1; // Adjust this value to control when animation starts
      const isSettled = posDiff < settledThreshold && rotDiff < settledThreshold && scaleDiff < settledThreshold;

      if (isSettled && !roseSettled) {
        setRoseSettled(true);
        // Add delay before eye animation starts
        setTimeout(() => {
          setEyeProgress(1);
        }, 800); // 800ms delay
      }
    } else {
      // Reset when not in eye section
      setEyeProgress(0);
      setRoseSettled(false);
      setBulletsVisible(false);
      setTypingStates([false, false, false]);
    }
  }, [scrollY, roseSettled]);

  // Trigger bullet typing animations when entering eye section
  useEffect(() => {
    const h = window.innerHeight || 1;
    const sectionFloat = scrollY / h;

    const inEyeSection = sectionFloat > 0.7 && sectionFloat < 1.3;
    if (inEyeSection && !bulletsVisible) {
      setBulletsVisible(true);

      // Trigger typing animations in sequence
      setTimeout(() => {
        setTypingStates(prev => [true, false, false]);
      }, 300);

      setTimeout(() => {
        setTypingStates(prev => [true, true, false]);
      }, 800);

      setTimeout(() => {
        setTypingStates(prev => [true, true, true]);
      }, 1300);
    }
  }, [scrollY, bulletsVisible]);

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

        const start = ROSE_KEYFRAMES[0];
        roseModel.scale.set(start.scale, start.scale, start.scale);
        roseModel.position.set(
          start.position.x,
          start.position.y,
          start.position.z
        );
        roseModel.rotation.set(
          start.rotation.x,
          start.rotation.y,
          start.rotation.z
        );
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

        // Get the ideal pose based on scroll
        const { position, rotation, scale } = getRosePoseFromScroll(scrollY);

        // Smoothly interpolate towards that pose
        const posEase = 0.08;
        const rotEase = 0.08;
        const scaleEase = 0.05;

        roseModel.position.x += (position.x - roseModel.position.x) * posEase;
        roseModel.position.y += (position.y - roseModel.position.y) * posEase;
        roseModel.position.z += (position.z - roseModel.position.z) * posEase;

        roseModel.rotation.x += (rotation.x - roseModel.rotation.x) * rotEase;
        roseModel.rotation.y += (rotation.y - roseModel.rotation.y) * rotEase;
        roseModel.rotation.z += (rotation.z - roseModel.rotation.z) * rotEase;

        roseModel.scale.x += (scale - roseModel.scale.x) * scaleEase;
        roseModel.scale.y += (scale - roseModel.scale.y) * scaleEase;
        roseModel.scale.z += (scale - roseModel.scale.z) * scaleEase;

        // Optional: mouse influence layered on top
        const maxMouseInfluence = 0.01;
        const mouseFalloff = Math.min(scrollY / (window.innerHeight * 2.7), 1);
        const mouseInfluence = maxMouseInfluence * (1 - mouseFalloff);

        roseModel.rotation.y += mouseRef.current.x * mouseInfluence;
        roseModel.rotation.x += mouseRef.current.y * mouseInfluence * 0.5;
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
            <Eye progress={eyeProgress} />
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
                      transition-all duration-500 ease-out
                      hover:translate-x-2 hover:scale-105
                      ${
                        bulletsVisible
                          ? "opacity-100"
                          : "opacity-0"
                      }
                      ${
                        isActive
                          ? "scale-105"
                          : "hover:opacity-100"
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
                      <TypingText
                        text={`0${index + 1}`}
                        speed={100}
                        trigger={typingStates[index]}
                        cursor={false}
                      />
                    </span>
                    <span
                      className="block text-lg font-medium tracking-wide"
                      style={{ fontFamily: "Notable, serif" }}
                    >
                      <TypingText
                        text={bullet.title}
                        speed={80}
                        trigger={typingStates[index]}
                        cursor={true}
                      />
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
