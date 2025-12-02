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
    position: { x: -4.1, y: -1, z: 0 },
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

function CustomCursor({ active, variant = 'normal', color = 'black' }) {
  const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = React.useState({ x: 0, y: 0 });
  const animationRef = React.useRef();

  // Easing factor - lower = more floaty/laggy
  const easeFactor = variant === 'hover' ? 0.3 : 0.15; // Snappier on hover

  React.useEffect(() => {
    if (!active) return;

    const handleMouseMove = (e) => {
      setTargetPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop for smooth easing
    const animate = () => {
      setCursorPos(prev => ({
        x: prev.x + (targetPos.x - prev.x) * easeFactor,
        y: prev.y + (targetPos.y - prev.y) * easeFactor,
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, targetPos, easeFactor]);

  if (!active) return null;

  // Size and opacity adjustments for hover variant
  const outerSize = variant === 'hover' ? 32 : 28; // 26-30px range
  const innerSize = variant === 'hover' ? 6 : 5;   // 4-6px range
  const strokeOpacity = variant === 'hover' ? 0.6 : 1;

  // Color scheme based on background
  const isWhite = color === 'white';
  const borderColor = isWhite ? 'border-white' : 'border-black';
  const bgColor = isWhite ? 'bg-white' : 'bg-black';

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-normal"
      style={{
        transform: `translate(${cursorPos.x - outerSize/2}px, ${cursorPos.y - outerSize/2}px)`,
        transition: 'none', // We'll handle animation manually
      }}
    >
      {/* Outer circle */}
      <div
        className={`absolute rounded-full bg-transparent ${borderColor}`}
        style={{
          width: `${outerSize}px`,
          height: `${outerSize}px`,
          borderWidth: '1.5px',
          opacity: strokeOpacity,
          transform: variant === 'hover' ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
        }}
      />
      {/* Inner dot */}
      <div
        className={`absolute rounded-full ${bgColor}`}
        style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

// Hook for intersection observer animations
function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
}

function Home() {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0); // for Three.js loop
  const scrollContainerRef = useRef(null);
  const heroRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [eyeProgress, setEyeProgress] = useState(0);
  const [roseSettled, setRoseSettled] = useState(false);
  const [bulletsVisible, setBulletsVisible] = useState(false);
  const [typingStates, setTypingStates] = useState([false, false, false]);
  const [animationsPlayed, setAnimationsPlayed] = useState(false);

  // Custom cursor state
  const [cursorActive, setCursorActive] = useState(false);
  const [cursorVariant, setCursorVariant] = useState('normal');
  const [cursorColor, setCursorColor] = useState('black');

  // Refs for intersection observer animations
  const panel1Ref = React.useRef(null);

  // Intersection states for animations
  const panel1Visible = useIntersectionObserver(panel1Ref);

  // Helper function to determine cursor color based on background
  const getCursorColor = (element) => {
    if (!element) return 'black';

    // Check for known dark elements
    if (element.classList.contains('bg-black') ||
        element.closest('.bg-black')) {
      return 'white';
    }

    // Check computed background color
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;

    // If it's transparent, check parent elements
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      let parent = element.parentElement;
      while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        const parentBg = parentStyle.backgroundColor;
        if (parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
          // Parse RGB values to determine if dark or light
          const rgb = parentBg.match(/\d+/g);
          if (rgb && rgb.length >= 3) {
            const [r, g, b] = rgb.map(Number);
            // Calculate brightness (YIQ formula)
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128 ? 'white' : 'black';
          }
          break;
        }
        parent = parent.parentElement;
      }
      return 'black'; // Default fallback
    }

    // Parse RGB values from background-color
    const rgb = bgColor.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb.map(Number);
      // Calculate brightness (YIQ formula)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128 ? 'white' : 'black';
    }

    return 'black'; // Default fallback
  };

  const bullets = [
    {
      rayLabel: "01 INTERFACE DESIGN",
      tinyLabel: "INTERFACE DESIGN",
      heading: "Interfaces that feel obvious, not overdesigned.",
      body: "I design flows, layouts, and interactions that make it clear what to do next.\n\nStrong hierarchy, calm typography, and motion that supports understanding instead of distracting from it.",
      inPractice: ["Clear user flows", "Scannable layouts", "Accessible defaults"],
      tools: "TOOLS · Figma · Pen & paper · Prototyping"
    },
    {
      rayLabel: "02 FRONTEND DEVELOPMENT",
      tinyLabel: "FRONTEND DEVELOPMENT",
      heading: "Production-ready frontends, not just Dribbble shots.",
      body: "I build React interfaces with reusable components, clean structure, and animation used on purpose.\n\nThe goal is code that's maintainable, easy to iterate on, and faithful to the design without being fragile.",
      inPractice: ["Component systems", "Design–dev handoff", "Thoughtful animation"],
      tools: "STACK · React · Tailwind · Framer Motion · Three.js"
    },
    {
      rayLabel: "03 PERFORMANCE",
      tinyLabel: "PERFORMANCE & TECHNICAL SEO",
      heading: "Speed and structure that search engines actually like.",
      body: "I care about how a site feels and how it performs under the hood: Core Web Vitals, semantic markup, and clean metadata.\n\nI've built and use my own technical SEO scanner to surface issues and turn them into fixes.",
      inPractice: ["Core Web Vitals", "Semantic HTML", "Clean metadata & sitemaps"],
      tools: "TOOLS · Lighthouse · WebPageTest · AI Visibility"
    },
  ];

  // Loading component
  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-[#ece6da] flex items-center justify-center z-[1000]">
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
        if (!animationsPlayed) {
          // Add delay before eye animation starts (first time only)
          setTimeout(() => {
            setEyeProgress(1);
          }, 800); // 800ms delay
        } else {
          // Subsequent visits - show completed state immediately
          setEyeProgress(1);
        }
      }
    } else {
      // Reset eye progress when not in eye section
      setEyeProgress(0);
      setRoseSettled(false);
      // Keep bulletsVisible and typingStates for subsequent visits to show completed state
    }
  }, [scrollY, roseSettled]);

  // Trigger bullet typing animations when entering eye section (only once per load)
  useEffect(() => {
    const h = window.innerHeight || 1;
    const sectionFloat = scrollY / h;

    const inEyeSection = sectionFloat > 0.7 && sectionFloat < 1.3;
    if (inEyeSection) {
      if (!animationsPlayed) {
        // First time entering - trigger animations
        setBulletsVisible(true);
        setAnimationsPlayed(true);

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
      } else {
        // Subsequent visits - show completed state immediately
        setBulletsVisible(true);
        setTypingStates([true, true, true]);
      }
    }
  }, [scrollY, bulletsVisible, animationsPlayed]);

  // Custom cursor event handlers - active on entire page
  React.useEffect(() => {
    if (isLoading) return;

    const handleMouseEnter = () => {
      setCursorActive(true);
    };

    const handleMouseLeave = () => {
      setCursorActive(false);
      setCursorVariant('normal');
    };

    const handleMouseMove = (e) => {
      // Always active on the page now
      setCursorActive(true);

      // Check if mouse is over an interactive element
      const target = e.target;
      const isInteractive = target.tagName === 'BUTTON' ||
                           target.tagName === 'A' ||
                           target.closest('button') ||
                           target.closest('a') ||
                           target.classList.contains('cursor-hover');

      setCursorVariant(isInteractive ? 'hover' : 'normal');

      // Determine cursor color based on background
      const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
      const newColor = getCursorColor(elementUnderCursor);
      setCursorColor(newColor);
    };

    // Listen on the main element for page-wide cursor
    const mainElement = scrollContainerRef.current;
    if (mainElement) {
      mainElement.addEventListener('mousemove', handleMouseMove);
      mainElement.addEventListener('mouseenter', handleMouseEnter);
      mainElement.addEventListener('mouseleave', handleMouseLeave);
    }

    // Also listen on window for when mouse leaves the entire page
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('mousemove', handleMouseMove);
        mainElement.removeEventListener('mouseenter', handleMouseEnter);
        mainElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isLoading]);

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
    <>
      {/* Custom cursor - only active over hero section */}
      <CustomCursor active={cursorActive} variant={cursorVariant} color={cursorColor} />

      <main
        ref={scrollContainerRef}
        className="
          bg-[#ece6da] text-gray-900
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
      <section
        ref={heroRef}
        className="h-screen relative flex items-center snap-center"
      >
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
              className="text-xl font-normal text-black opacity-80 my-2 mb-4 max-w-170"
              style={{ fontFamily: "Notable, serif" }}
            >
              Designing interfaces. Building fast, technically-sound systems behind them.
            </p>
            <p
              className="text-sm font-mono text-black opacity-60 tracking-wide"
              style={{ fontFamily: "Share Tech Mono, monospace" }}
            >
              React · Three.js · Tailwind · Performance · Technical SEO
            </p>

            <div className="absolute bottom-0 left-0 flex gap-4 top-100">
              <button
                className="w-32 h-32 bg-black text-white font-mono text-sm tracking-wide hover:bg-gray-800 transition-colors duration-200 cursor-pointer flex items-center justify-center"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                <span className="text-center leading-tight">
                  See My<br />Work
                </span>
              </button>
              <button
                className="w-32 h-32 border-2 border-black text-black font-mono text-sm tracking-wide hover:bg-black/20 hover:text-black transition-all duration-200 cursor-pointer flex items-center justify-center"
                style={{ fontFamily: "Share Tech Mono, monospace" }}
              >
                <span className="text-center leading-tight">
                  Book A<br />Call
                </span>
              </button>
            </div>

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
      <section className="h-screen bg-[#ece6da] flex items-center snap-center">
        <div className="max-w-6xl mx-auto px-8 flex items-center gap-12 w-full">
          {/* Right: animated eye */}
          <div className="w-[400px] flex justify-center -ml-32">
            <Eye progress={eyeProgress} />
          </div>

          {/* Left: fanned bullet titles emerging from the moon */}
          <div className="flex-1 max-w-lg">
            <div className="relative h-[500px] flex items-center -ml-48">
              {bullets.map((bullet, index) => {
                // Much bigger vertical spacing + more fan, pushed further left
                const offsetsY = [-60, 0, 60];
                const rotations = [-9, 0, 9];
                const translateX = [25, 35, 25]; // moved left

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
                      className="block text-xl uppercase tracking-[0.25em] mb-2"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      <TypingText
                        text={bullet.rayLabel}
                        speed={100}
                        trigger={typingStates[index]}
                        cursor={false}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center-Right: flip-board detail panel */}
          <div className="flex-1 flex items-center justify-center ml-8 -mr-16">
            <div className=" perspective-1000">
              <div
                className="bg-black text-white rounded-3xl px-10 py-10 shadow-2xl w-[480px] h-[550px] flex flex-col"
              >
                {/* Tiny label at top */}
                <p
                  className="text-xs uppercase tracking-[0.3em] mb-6 opacity-70"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  {bullets[activeIndex].tinyLabel}
                </p>

                {/* Big heading */}
                <h3
                  className="text-2xl font-semibold mb-6 leading-tight"
                  style={{ fontFamily: "Notable, serif" }}
                >
                  <FlipText
                    text={bullets[activeIndex].heading}
                    speed={30}
                    triggerKey={`heading-${activeIndex}`}
                  />
                </h3>

                {/* Body text */}
                <div className="flex-1 mb-8">
                  <p className="text-base leading-relaxed text-gray-200 whitespace-pre-line">
                    <FlipText
                      text={bullets[activeIndex].body}
                      speed={20}
                      triggerKey={`body-${activeIndex}`}
                    />
                  </p>
                </div>

                {/* In practice row */}
                <div className="mb-6">
                  <p
                    className="text-xs uppercase tracking-[0.2em] mb-3 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    IN PRACTICE
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bullets[activeIndex].inPractice.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-800 px-3 py-1 rounded-full"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools line at bottom */}
                <p
                  className="text-xs uppercase tracking-wide opacity-60 mt-auto"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  {bullets[activeIndex].tools}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rose Focus – Card 1 (about you + skills) */}
      <section
        ref={panel1Ref}
        className={`
          relative h-screen bg-[#ece6da] snap-center
          transition-all duration-500
          ${panel1Visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
      >
        {/* content sits ABOVE the rose */}
        <div className="relative z-[200] h-full flex items-center">
          <div
            className="
              max-w-9xl w-full
              px-6 md:px-10
              mx-auto md:ml-[6vw] md:mr-auto   /* push whole block left */
            "
          >
            <div
              className="
                grid grid-cols-1
                md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1.5fr)]
                gap-10 md:gap-24 pr-24
                items-center
              "
            >
              {/* Left: main black card about you */}
              <div className="bg-black text-[#ece6da] rounded-3xl border border-black shadow-2xl p-8 md:p-10">
                <p
                  className="text-xs uppercase tracking-[0.3em] opacity-60 mb-4"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  About me
                </p>

                <h2
                  className="text-4xl md:text-5xl leading-tight mb-6"
                  style={{ fontFamily: "Notable, serif" }}
                >
                  Designing interfaces,
                  <span className="block md:inline"> building the systems behind them.</span>
                </h2>

                <p className="text-sm md:text-base opacity-90 leading-relaxed">
                  I'm Liam, a UI/UX designer and front-end developer focused on clear flows,
                  confident typography, and interfaces that feel intentional rather than
                  over-designed. I like working where product strategy, interaction design,
                  and implementation overlap — taking ideas from sketch to shipped experience.
                </p>

                <p className="text-sm md:text-base opacity-90 leading-relaxed mt-4">
                  Most of my work lives in that space between visual polish and technical
                  detail: motion that supports understanding, layouts that scale with real
                  content, and builds that respect performance and accessibility.
                </p>
              </div>

              {/* Middle: reserved space for the rose (now wider) */}
              <div className="hidden md:block pointer-events-none">
                <div className="w-full h-[420px]" />
              </div>

              {/* Right: skills/meta */}
              <div className="grid grid-cols-1 gap-5 text-sm text-black">
                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Role
                  </p>
                  <p className="text-sm">
                    UI/UX Design · Front-end Development · Product thinking
                  </p>
                </div>

                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Focus
                  </p>
                  <p className="text-sm">
                    Interaction design, motion, layout systems, design/dev handoff,
                    and experiences that feel light but intentional.
                  </p>
                </div>

                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Stack
                  </p>
                  <p className="text-sm">
                    React · Three.js · Tailwind · Framer Motion · Figma · a lot of
                    small prototypes and experiments.
                  </p>
                </div>

                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Experience
                  </p>
                  <p className="text-sm">
                    4+ years designing digital products, from concept to launch,
                    across web and mobile platforms.
                  </p>
                </div>

                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Approach
                  </p>
                  <p className="text-sm">
                    User-centered design with technical excellence. I believe great
                    products emerge from the intersection of empathy and craft.
                  </p>
                </div>

                <div className="border border-black rounded-2xl px-4 py-3 bg-[#f2ebdd] h-24 flex flex-col justify-center">
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                    style={{ fontFamily: "Share Tech Mono, monospace" }}
                  >
                    Specialties
                  </p>
                  <p className="text-sm">
                    Design systems · Component libraries · Motion design · A11y ·
                    Performance optimization · Cross-functional collaboration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}

export default Home;
