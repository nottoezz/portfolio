import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  FaReact,
  FaNodeJs,
  FaLinux,
} from "react-icons/fa";
import {
  SiExpress,
  SiPostgresql,
  SiMongodb,
  SiSupabase,
  SiThreedotjs,
  SiTailwindcss,
  SiFramer,
  SiFigma,
} from "react-icons/si";

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const isBrowser = typeof window !== "undefined";

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
    rotation: { x: 0.2, y: Math.PI * 1.5, z: 0 },
    scale: 0.7,
  },
  {
    // Section 2 – final tiny focus
    position: { x: 4.5, y: -2, z: -3 },
    rotation: { x: 0, y: Math.PI / 2, z: 0 },
    scale: 1.5,
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Given scrollY, returns interpolated pose between keyframes.
 * Only safe to use in browser (but we guard for height).
 */
function getRosePoseFromScroll(scrollY, viewportHeight) {
  const h = viewportHeight || (isBrowser ? window.innerHeight : 1) || 1;

  const sectionFloat = scrollY / h;
  const idx = Math.floor(sectionFloat);
  const t = clamp(sectionFloat - idx, 0, 1);

  const last = ROSE_KEYFRAMES[ROSE_KEYFRAMES.length - 1];
  const from = ROSE_KEYFRAMES[idx] || last;
  const to = ROSE_KEYFRAMES[idx + 1] || last;

  return {
    position: {
      x: lerp(from.position.x, to.position.x, t),
      y: lerp(from.position.y, to.position.y, t),
      z: lerp(from.position.z, to.position.z, t),
    },
    rotation: {
      x: lerp(from.rotation.x, to.rotation.x, t),
      y: lerp(from.rotation.y, to.rotation.y, t),
      z: lerp(from.rotation.z, to.rotation.z, t),
    },
    scale: lerp(from.scale, to.scale, t),
  };
}

// ---------------------------------------------------------------------------
// Eye
// ---------------------------------------------------------------------------

function Eye({ progress = 0 }) {
  const radius = 144;
  const circumference = 2 * Math.PI * radius;
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
          r={radius}
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

// ---------------------------------------------------------------------------
// Typing text (hero bullet rays)
// ---------------------------------------------------------------------------

function TypingText({ text, speed = 50, trigger = false, cursor = true }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setDisplayText("");
      setShowCursor(false);
      return;
    }

    let index = 0;
    let cursorTimeoutId;
    const intervalId = window.setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index += 1;
      } else {
        clearInterval(intervalId);
        // Keep cursor briefly after finishing
        cursorTimeoutId = window.setTimeout(() => {
          setShowCursor(false);
        }, 500);
      }
    }, speed);

    setShowCursor(true);

    return () => {
      clearInterval(intervalId);
      if (cursorTimeoutId) {
        clearTimeout(cursorTimeoutId);
      }
    };
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

// ---------------------------------------------------------------------------
// Flip text (flip-board style text)
// ---------------------------------------------------------------------------

function FlipText({ text, speed = 30, triggerKey }) {
  const [display, setDisplay] = useState(() => text || "");

  useEffect(() => {
    if (!text) return;

    const targetChars = text.split("");

    const intervalId = window.setInterval(() => {
      let shouldStop = false;

      setDisplay((prev) => {
        // Ensure prev has at least the same length (pad with spaces)
        const prevChars = (prev || "")
          .padEnd(targetChars.length, " ")
          .split("");

        let allDone = true;

        const nextChars = targetChars.map((target, i) => {
          const current = prevChars[i] ?? " ";

          // Non-letters just snap to target
          if (!/[A-Za-z]/.test(target)) {
            if (current !== target) {
              allDone = false;
            }
            return target;
          }

          const isLower = target === target.toLowerCase();
          const alpha = isLower ? ALPHABET.toLowerCase() : ALPHABET;

          // Already correct → keep as is
          if (current === target) {
            return current;
          }

          // Find current index in the alphabet (if not found, start from A/a)
          const currentIdx = alpha.indexOf(current);
          const nextIdx =
            currentIdx === -1 ? 0 : (currentIdx + 1) % alpha.length;

          const nextChar = alpha[nextIdx];

          // If we still haven't reached target, we're not done yet
          if (nextChar !== target) {
            allDone = false;
          }

          return nextChar;
        });

        shouldStop = allDone;
        return nextChars.join("");
      });

      if (shouldStop) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, triggerKey]);

  return <span className="inline-block whitespace-pre-wrap">{display}</span>;
}


// ---------------------------------------------------------------------------
// Custom cursor
// ---------------------------------------------------------------------------

function getCursorColorForElement(element) {
  if (!isBrowser || !element) return "black";

  // Prefer explicit dark backgrounds
  if (element.classList.contains("bg-black") || element.closest(".bg-black")) {
    return "white";
  }

  const getBgColor = (el) => {
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return null;
    return bg;
  };

  let el = element;
  let bg = null;
  while (el && !bg) {
    bg = getBgColor(el);
    el = el.parentElement;
  }

  if (!bg) return "black";

  const rgb = bg.match(/\d+/g);
  if (!rgb || rgb.length < 3) return "black";

  const [r, g, b] = rgb.map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 128 ? "white" : "black";
}

function isInteractiveElement(element) {
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase();

  if (tagName === "button" || tagName === "a") return true;
  if (element.closest("button") || element.closest("a")) return true;
  if (element.classList.contains("cursor-hover")) return true;

  return false;
}

function CustomCursor({ active = true }) {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [resolvedColor, setResolvedColor] = useState("black");
  const [variant, setVariant] = useState("normal"); // 'normal' | 'hover'

  const targetPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  const easeFactor = variant === "hover" ? 0.3 : 0.15;

  useEffect(() => {
    if (!active || !isBrowser) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      targetPosRef.current = { x: clientX, y: clientY };

      const elementUnderCursor = document.elementFromPoint(clientX, clientY);
      setResolvedColor(getCursorColorForElement(elementUnderCursor));
      setVariant(isInteractiveElement(elementUnderCursor) ? "hover" : "normal");
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      setCursorPos((prev) => {
        const { x: tx, y: ty } = targetPosRef.current;
        const x = prev.x + (tx - prev.x) * easeFactor;
        const y = prev.y + (ty - prev.y) * easeFactor;
        return { x, y };
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, easeFactor]);

  if (!active) return null;

  const isWhite = resolvedColor === "white";
  const outerSize = variant === "hover" ? 32 : 28;
  const innerSize = variant === "hover" ? 6 : 5;
  const strokeOpacity = variant === "hover" ? 0.6 : 1;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-9999 mix-blend-normal"
      style={{
        transform: `translate(${cursorPos.x - outerSize / 2}px, ${
          cursorPos.y - outerSize / 2
        }px)`,
      }}
    >
      <div
        className={`absolute rounded-full bg-transparent ${
          isWhite ? "border-white" : "border-black"
        }`}
        style={{
          width: outerSize,
          height: outerSize,
          borderWidth: "1.5px",
          opacity: strokeOpacity,
          transform: variant === "hover" ? "scale(1.2)" : "scale(1)",
          transition: "transform 0.2s ease-out, opacity 0.2s ease-out",
        }}
      />
      <div
        className={`absolute rounded-full ${isWhite ? "bg-white" : "bg-black"}`}
        style={{
          width: innerSize,
          height: innerSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intersection observer hook
// ---------------------------------------------------------------------------

function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!isBrowser) {
      setIsIntersecting(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// ---------------------------------------------------------------------------
// Stack items config
// ---------------------------------------------------------------------------

const STACK_ITEMS = [
  { label: "React", Icon: FaReact },
  { label: "Node.js", Icon: FaNodeJs },
  { label: "Express", Icon: SiExpress },
  { label: "PostgreSQL", Icon: SiPostgresql },
  { label: "MongoDB", Icon: SiMongodb },
  { label: "Supabase", Icon: SiSupabase },
  { label: "Three.js", Icon: SiThreedotjs },
  { label: "Tailwind", Icon: SiTailwindcss },
  { label: "Framer Motion", Icon: SiFramer },
  { label: "Figma", Icon: SiFigma },
  { label: "Linux / infra", Icon: FaLinux },
];

// ---------------------------------------------------------------------------
// Bullets config
// ---------------------------------------------------------------------------

const bullets = [
  {
    rayLabel: "01 INTERFACE DESIGN",
    tinyLabel: "INTERFACE DESIGN",
    heading: "Interfaces that feel obvious, not overdesigned.",
    body: "I design flows, layouts, and interactions that make it clear what to do next.\n\nStrong hierarchy, calm typography, and motion that supports understanding instead of distracting from it.",
    inPractice: [
      "Clear user flows",
      "Scannable layouts",
      "Accessible defaults",
    ],
    tools: "TOOLS · Figma · Pen & paper · Prototyping",
  },
  {
    rayLabel: "02 FRONTEND DEVELOPMENT",
    tinyLabel: "FRONTEND DEVELOPMENT",
    heading: "Production-ready frontends, not just Dribbble shots.",
    body: "I build React interfaces with reusable components, clean structure, and animation used on purpose.\n\nThe goal is code that's maintainable, easy to iterate on, and faithful to the design without being fragile.",
    inPractice: [
      "Component systems",
      "Design–dev handoff",
      "Thoughtful animation",
    ],
    tools: "STACK · React · Tailwind · Framer Motion · Three.js",
  },
  {
    rayLabel: "03 PERFORMANCE & SEO",
    tinyLabel: "PERFORMANCE & TECHNICAL SEO",
    heading: "Speed and structure that search engines actually like.",
    body: "I care about how a site feels and how it performs under the hood: Core Web Vitals, semantic markup, and clean metadata.\n\nI've built and use my own technical SEO scanner to surface issues and turn them into fixes.",
    inPractice: [
      "Core Web Vitals",
      "Semantic HTML",
      "Clean metadata & sitemaps",
    ],
    tools: "TOOLS · Lighthouse · WebPageTest · AI Visibility",
  },
  {
    rayLabel: "04 BACKEND & APIS",
    tinyLabel: "BACKEND · APIS · DATA",
    heading: "Backends, databases, and APIs that support the UX.",
    body: "I design and build lean backends to support the interfaces I create: REST APIs, authentication, and data models aligned with the product.\n\nEnough structure to be reliable, without over-engineering early versions.",
    inPractice: [
      "RESTful APIs",
      "Auth & permissions",
      "Relational & document stores",
    ],
    tools: "STACK · Node.js · Express · MongoDB · PostgreSQL",
  },
];

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#ece6da] flex items-center justify-center z-1000">
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
}

// ---------------------------------------------------------------------------
// Main Home component
// ---------------------------------------------------------------------------

function Home() {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0); // for Three.js loop
  const scrollContainerRef = useRef(null);
  const panel1Ref = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [eyeProgress, setEyeProgress] = useState(0);
  const [roseSettled, setRoseSettled] = useState(false);
  const [bulletsVisible, setBulletsVisible] = useState(false);
  const [typingStates, setTypingStates] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [animationsPlayed, setAnimationsPlayed] = useState(false);

  const panel1Visible = useIntersectionObserver(panel1Ref);

  // Asset loading detection
  useEffect(() => {
    const checkAssetsLoaded = async () => {
      try {
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

        // Small delay for nicer transition
        window.setTimeout(() => setIsLoading(false), 2000);
      } catch {
        setIsLoading(false);
      }
    };

    if (isBrowser) {
      checkAssetsLoaded();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Scroll detection
  useEffect(() => {
    if (isLoading) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const y = el.scrollTop;
      setScrollY(y);
      scrollRef.current = y;
    };

    el.addEventListener("scroll", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [isLoading]);

  // Eye animation trigger when rose settles in eye section
  useEffect(() => {
    if (!isBrowser) return;

    const h = window.innerHeight || 1;
    const sectionFloat = scrollY / h;
    const inEyeSection = sectionFloat > 0.7 && sectionFloat < 1.3;

    let timeoutId;

    if (inEyeSection) {
      const eyeKeyframe = ROSE_KEYFRAMES[1];
      const currentPose = getRosePoseFromScroll(scrollY, h);

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

      const settledThreshold = 0.1;
      const isSettled =
        posDiff < settledThreshold &&
        rotDiff < settledThreshold &&
        scaleDiff < settledThreshold;

      if (isSettled && !roseSettled) {
        setRoseSettled(true);

        if (!animationsPlayed) {
          timeoutId = window.setTimeout(() => {
            setEyeProgress(1);
          }, 800); // delay for first time
        } else {
          setEyeProgress(1); // immediate on subsequent visits
        }
      }
    } else {
      setEyeProgress(0);
      setRoseSettled(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [scrollY, roseSettled, animationsPlayed]);

  // Trigger bullet typing animations when entering eye section (only once per load)
  useEffect(() => {
    if (!isBrowser) return;

    const h = window.innerHeight || 1;
    const sectionFloat = scrollY / h;
    const inEyeSection = sectionFloat > 0.7 && sectionFloat < 1.3;

    if (!inEyeSection) return;

    // First visit – play sequence
    if (!animationsPlayed) {
      setBulletsVisible(true);
      setAnimationsPlayed(true);

      const timeouts = [];

      timeouts.push(
        window.setTimeout(() => {
          setTypingStates([true, false, false, false]);
        }, 300)
      );

      timeouts.push(
        window.setTimeout(() => {
          setTypingStates([true, true, false, false]);
        }, 800)
      );

      timeouts.push(
        window.setTimeout(() => {
          setTypingStates([true, true, true, false]);
        }, 1300)
      );

      timeouts.push(
        window.setTimeout(() => {
          setTypingStates([true, true, true, true]);
        }, 1800)
      );

      return () => {
        timeouts.forEach(clearTimeout);
      };
    }

    // Subsequent visits – snap to finished
    setBulletsVisible(true);
    setTypingStates([true, true, true, true]);
  }, [scrollY, animationsPlayed]);

  // Three.js setup
  useEffect(() => {
    if (isLoading || !mountRef.current || !isBrowser) return;

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
    let animationFrameId = null;
    let isCancelled = false;

    const loader = new GLTFLoader();

    loader.load(
      "/rose.glb",
      (gltf) => {
        if (isCancelled) return;

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
      animationFrameId = requestAnimationFrame(animate);

      if (roseModel) {
        const y = scrollRef.current;
        const viewportHeight = window.innerHeight || 1;
        const { position, rotation, scale } = getRosePoseFromScroll(
          y,
          viewportHeight
        );

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

        const maxMouseInfluence = 0.01;
        const mouseFalloff = Math.min(y / (viewportHeight * 2.7), 1);
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
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

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
      {/* Custom cursor – active once loading is done */}
      <CustomCursor active={!isLoading} />

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
        <section className="h-screen relative flex items-center snap-center">
          <div
            className="fixed left-[20vw] top-[50%] -translate-y-1/2 z-200 transition-all duration-300"
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
                Designing interfaces. Building fast, technically-sound systems
                behind them.
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
                    See My
                    <br />
                    Work
                  </span>
                </button>
                <button
                  className="w-32 h-32 border-2 border-black text-black font-mono text-sm tracking-wide hover:bg-black/20 hover:text-black transition-all duration-200 cursor-pointer flex items-center justify-center"
                  style={{ fontFamily: "Share Tech Mono, monospace" }}
                >
                  <span className="text-center leading-tight">
                    Book A
                    <br />
                    Call
                  </span>
                </button>
              </div>

              <div
                className="fixed left-[47vw] top-[90%] -translate-y-1/2 z-200 transition-opacity duration-300"
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
                  const offsetsY = [-80, -30, 30, 80];
                  const rotations = [-20, -4, 4, 20];
                  const translateX = [8, 30, 30, 8];

                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={bullet.rayLabel}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      className={`
                        absolute left-0 origin-left
                        text-left
                        transition-all duration-500 ease-out
                        hover:translate-x-2 hover:scale-105
                        ${bulletsVisible ? "opacity-100" : "opacity-0"}
                        ${isActive ? "scale-105" : "hover:opacity-100"}
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
              <div className="perspective-1000">
                <div className="bg-black text-white rounded-3xl px-10 py-10 shadow-2xl w-[480px] h-[550px] flex flex-col">
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
        {/* Rose Focus – abstract mosaic layout */}
        <section
          ref={panel1Ref}
          className={`
            relative h-screen bg-[#ece6da] snap-center
            transition-all duration-500
            ${
              panel1Visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }
          `}
        >
          {/* content sits ABOVE the rose */}
          <div className="relative z-200 h-full flex items-center">
            <div className="w-full px-4 md:px-8 mx-auto">
              <div className="relative h-[80vh] md:h-[78vh]">
                {/* 5x5 abstract grid using full width & height */}
                <div
                  className="relative h-full grid gap-3 md:gap-4 lg:gap-5"
                  style={{
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gridTemplateRows: "repeat(5, minmax(0, 1fr))",
                  }}
                >
                  {/* div1 – big about story card (1 / 1 / 4 / 3) */}
                  <div
                    className="bg-black text-[#ece6da] rounded-3xl shadow-2xl p-6 md:p-8 flex items-center justify-center"
                    style={{ gridArea: "1 / 1 / 4 / 3" }}
                  >
                    <h2
                      className="text-4xl md:text-5xl lg:text-6xl leading-tight text-center"
                      style={{ fontFamily: "Notable, serif" }}
                    >
                      Designing interfaces,
                      <span className="block">
                        engineering the systems that power them.
                      </span>
                    </h2>
                  </div>
                  {/* div6 – long top strip card (1 / 3 / 2 / 6) */}
                  <div
                    className="border border-black/80 rounded-2xl bg-[#f4ebdd] px-5 py-3 flex flex-col justify-center"
                    style={{ gridArea: "1 / 3 / 2 / 6" }}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p
                        className="text-[10px] uppercase tracking-[0.25em] opacity-70"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        Approach
                      </p>
                      <p className="text-[11px] md:text-[13px] leading-snug text-black/80 max-w-[38rem]">
                        Start from constraints and real content, ship something
                        small, then refine. Mix craft with pragmatism: clean
                        systems, clear UX, and code that can evolve.
                      </p>
                    </div>
                  </div>
                  {/* div4 – small tag above rose (2 / 3 / 3 / 4) */}
                  {/* div4 – Creative waves card (2 / 3 / 3 / 4) */}
                  <div
                    className="creative-card border border-black/40 rounded-2xl overflow-hidden"
                    style={{ gridArea: "2 / 3 / 3 / 4" }}
                  >
                    {/* animated SVG waves in the background */}
                    <svg
                      className="creative-card__waves"
                      viewBox="0 0 1440 320"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <g>
                        {/* main wave */}
                        <path
                          d="M0,224L48,218.7C96,213,192,203,288,208C384,213,480,235,576,245.3C672,256,768,256,864,218.7C960,181,1056,107,1152,101.3C1248,96,1344,160,1392,192L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                          fill="#000000"
                          fillOpacity="0.06"
                        />
                        {/* second, slightly offset wave for depth */}
                        <path
                          d="M0,240L60,218.7C120,197,240,155,360,149.3C480,144,600,176,720,197.3C840,219,960,229,1080,229.3C1200,229,1320,219,1380,213.3L1440,208L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                          fill="#000000"
                          fillOpacity="0.035"
                        />
                      </g>
                    </svg>

                    {/* centered label */}
                    <div className="relative flex items-center justify-center h-full px-3 py-2">
                      <span
                        className="text-[15px] uppercase tracking-[0.35em] text-black/85"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        creative
                      </span>
                    </div>
                  </div>
                  {/* div7 – main rose window (2 / 4 / 5 / 5) – stays central-ish */}
                  <div
                    className="relative rounded-[2.2rem] border-2 border-black/40 bg-[#ece6da] flex items-center justify-center overflow-hidden"
                    style={{ gridArea: "2 / 4 / 5 / 5" }}
                  >
                    <div className="absolute inset-[12%] border border-black/20 rounded-[1.9rem]" />
                    <div className="absolute inset-[26%] border border-dashed border-black/15 rounded-[1.7rem]" />
                    <div className="absolute bottom-4 right-5 flex items-center gap-2">
                      <span className="h-1 w-8 bg-black" />
                      <span
                        className="text-[10px] uppercase tracking-[0.25em] text-black/60"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        orbit / scroll
                      </span>
                    </div>
                    {/* 3D rose renders behind via Three.js */}
                  </div>
                  {/* div8 – tall Focus card (2 / 5 / 4 / 6) */}
                  <div
                    className="border border-black rounded-2xl bg-[#efe5d2] px-4 py-3 flex flex-col justify-between"
                    style={{ gridArea: "2 / 5 / 4 / 6" }}
                  >
                    <div>
                      <p
                        className="text-[11px] uppercase tracking-[0.2em] mb-3 opacity-70"
                        style={{ fontFamily: "Share Tech Mono, monospace" }}
                      >
                        Focus
                      </p>
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src="/focusCardImg.png"
                          alt="Focus illustration"
                          className="w-35 h-35 object-contain rounded-lg flex-shrink-0"
                        />
                        <div className="font-extrabold text-4xl right-0 leading-tight font-mono">
                          <div>Work</div>
                          <div>- Flow</div>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm leading-snug text-black/90 max-w-[28rem]">
                        End-to-end product work: interfaces, behaviour, data,
                        and performance — from first sketch to deployed build.
                      </p>
                    </div>
                  </div>
                  {/* div2 – Location card (3 / 3 / 5 / 4) */}
                  <div
                    className="border border-black rounded-2xl bg-[#f2ebdd] px-4 py-3 flex flex-col items-center justify-center"
                    style={{ gridArea: "3 / 3 / 5 / 4" }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] mb-2 opacity-70"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      Location
                    </p>

                    <img
                      src="/globe.png"
                      alt="Glove illustration"
                      className="w-38 h-38 md:w-45 md:h-45 object-contain"
                    />

                    <p
                      className="mt-3 text-[11px] uppercase tracking-[0.18em] opacity-80"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      South Africa
                    </p>
                  </div>
                  {/* div10 – Experience card (4 / 2 / 5 / 3) */}
                  <div
                    className="border border-black rounded-2xl bg-[#f2ebdd] px-4 py-3 flex flex-col justify-center"
                    style={{ gridArea: "4 / 2 / 5 / 3" }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      Experience
                    </p>
                    <p className="text-xs md:text-sm leading-snug text-black/90 max-w-[28rem]">
                      4+ years designing and building digital products, plus
                      founder / developer of an AI-powered technical SEO tool
                      used by early customers.
                    </p>
                  </div>
                  {/* div11 – Specialties card (4 / 1 / 5 / 2) */}
                  <div
                    className="border border-black rounded-2xl bg-[#efe3cf] px-4 py-3 flex flex-col justify-center"
                    style={{ gridArea: "4 / 1 / 5 / 2" }}
                  >
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] mb-1 opacity-70"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      Specialties
                    </p>
                    <p className="text-xs md:text-sm leading-snug text-black/90 max-w-[28rem]">
                      Design systems · Component libraries · APIs & data
                      modelling · Performance optimization · Technical SEO ·
                      Motion design · A11y
                    </p>
                  </div>
                  {/* div12 – long bottom left strip (5 / 1 / 6 / 4) */}
                  <div
                    className="border border-black rounded-2xl bg-[#f3ebdd] px-4 py-3 flex items-center"
                    style={{ gridArea: "5 / 1 / 6 / 4" }}
                  >
                    <div className="relative overflow-hidden w-full">
                      <div className="inline-block whitespace-nowrap animate-marquee">
                        {[...STACK_ITEMS, ...STACK_ITEMS].map(({ label, Icon }, index) => (
                          <div
                            key={`${label}-${index}`}
                            className="
                              inline-flex flex-col items-center justify-center
                              rounded-lg border border-black/10
                              bg-black/0 hover:bg-black/[0.03]
                              transition-all duration-200
                              py-5 px-3 cursor-default group
                              mr-6
                            "
                          >
                            <Icon className="w-25 h-10 text-black/80 group-hover:text-black mx-auto" />
                            <span
                              className="mt-2.5 text-[11px] text-black/70 tracking-[0.06em] uppercase text-center leading-tight"
                              style={{ fontFamily: "Share Tech Mono, monospace" }}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* div13 – bottom right strip (5 / 4 / 6 / 6) */}
                  <div
                    className="border border-black rounded-2xl bg-[#f8f0df] px-4 py-3 flex items-center justify-between gap-4"
                    style={{ gridArea: "5 / 4 / 6 / 6" }}
                  >
                    <div className="relative overflow-hidden flex-1">
                      <div className="inline-block whitespace-nowrap animate-marquee">
                        <span
                          className="text-4xl font-bold uppercase tracking-wider text-black/80 inline-block whitespace-nowrap"
                          style={{ fontFamily: "Share Tech Mono, monospace" }}
                        >
                          Portfolio · In progress · Selected work · Experiments · Interfaces · Systems · Performance ·{" "}
                        </span>
                        <span
                          className="text-4xl font-bold uppercase tracking-wider text-black/80 inline-block whitespace-nowrap"
                          style={{ fontFamily: "Share Tech Mono, monospace" }}
                        >
                          Portfolio · In progress · Selected work · Experiments · Interfaces · Systems · Performance ·{" "}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-mono text-black/60 shrink-0"
                      style={{ fontFamily: "Share Tech Mono, monospace" }}
                    >
                      LIAM / 2025
                    </span>
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
