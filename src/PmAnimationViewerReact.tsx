import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Box from "@mui/material/Box";
import { useAnimation } from "framer-motion";
import type {
  PmAnimationViewerProps,
  SceneObj,
  StepAnimation,
  Step,
} from "./types";

// @ts-ignore
const runSequence = async (seq: { controls: any; animation: any }[]) => {
  for (const step of seq) {
    await step.controls.start(step.animation);
  }
};

const PmAnimationViewerReact: React.FC<PmAnimationViewerProps> = ({
  playerParams = { controls: true, language: "en" },
  queue,
  queueDataBase64,
  autoplay: autoplayProp = true,
}) => {
  const [_, setLoading] = useState(true);
  const [__, setLoadedPct] = useState(0);
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesLoaded, setFilesLoaded] = useState(0);
  const [playerState, setPlayerState] = useState<
    "loading" | "loaded" | "playing" | "paused" | "stopped" | "finished" | null
  >(null);
  const [autoplay, setAutoplay] = useState<boolean>(!!autoplayProp);
  const [scale, setScale] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [prevTitle, setPrevTitle] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [animationSequences, setAnimationSequences] = useState<number>(0);
  const [scene, setScene] = useState<SceneObj[]>([]);

  const [stateMap, setStateMap] = useState<Record<string, any>>({});
  const [queueData, setQueueData] = useState<Step[]>([]);

  const animationItemsRef = useRef<Record<string, any[]>>({});
  const stepStartedRef = useRef<Date | null>(null);

  const infoBoxControls = useAnimation();
  const stepEndControls = useAnimation();
  const group1Controls = useAnimation();

  // DOM refs
  const infoBoxRef = useRef<HTMLDivElement | null>(null);
  const infoPrevRef = useRef<HTMLDivElement | null>(null);
  const stepEndRef = useRef<HTMLDivElement | null>(null);
  const group1Ref = useRef<HTMLDivElement | null>(null);

  // Constants
  const maxFPS = 30;
  const maxMoveFPS = 30;
  const maxFadeFPS = 15;

  const toothIds = useMemo(() => {
    const ids: number[] = [];
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 8; j++) ids.push(i * 10 + j);
    }
    return ids;
  }, []);

  const drillPositions = useMemo(
    () => ({
      11: { x: 259, y: 212 },
      12: { x: 173, y: 226 },
      13: { x: 117, y: 254 },
      14: { x: 91, y: 299 },
      15: { x: 69, y: 335 },
      16: { x: 59, y: 378 },
      17: { x: 52, y: 425 },
      18: { x: 52, y: 468 },
      21: { x: -248, y: 212 },
      22: { x: -166, y: 226 },
      23: { x: -105, y: 254 },
      24: { x: -88, y: 299 },
      25: { x: -67, y: 335 },
      26: { x: -53, y: 378 },
      27: { x: -43, y: 425 },
      28: { x: -43, y: 468 },
      31: { x: -275, y: 741 },
      32: { x: -217, y: 730 },
      33: { x: -167, y: 706 },
      34: { x: -136, y: 670 },
      35: { x: -107, y: 638 },
      36: { x: -87, y: 592 },
      37: { x: -66, y: 547 },
      38: { x: -56, y: 505 },
      41: { x: 283, y: 741 },
      42: { x: 221, y: 730 },
      43: { x: 171, y: 706 },
      44: { x: 142, y: 670 },
      45: { x: 108, y: 638 },
      46: { x: 89, y: 592 },
      47: { x: 67, y: 547 },
      48: { x: 59, y: 505 },
    }),
    []
  );

  const stateConfig = useMemo(
    () => ({
      31: [{ display: "1", z: 6000, part: "main", offsetY: -60 }],
    }),
    []
  );

  const getToothRegion = useCallback((id: number) => Math.floor(id / 10), []);

  const getDrillPosition = useCallback(
    (toothId?: number) => {
      if (!toothId) return undefined;
      // @ts-ignore
      const pos = drillPositions[toothId];
      return pos ? { ...pos } : undefined;
    },
    [drillPositions]
  );

  const getToolTransformations = useCallback((region: number) => {
    if (region === 1) return { rotateZ: 0, scaleX: 1.001, scaleY: 1.001 };
    if (region === 2) return { rotateZ: 0, scaleX: -1, scaleY: 1.001 };
    if (region === 3) return { rotateZ: 180, scaleX: 1, scaleY: 1 };
    if (region === 4) return { rotateZ: 0, scaleX: 1.001, scaleY: -1 };
    return { rotateZ: 0, scaleX: 1, scaleY: 1 };
  }, []);

  const getFPSLimitedSteps = useCallback((duration: number, max: number) => {
    return [Math.floor((duration / 1000) * max)];
  }, []);

  const getAngleOffsets = useCallback(
    (params: StepAnimation) => {
      const region = getToothRegion(params.tooth_id || 0);
      let xOffset = 0;
      if (params.correct_angle) {
        if ((params.tooth_id || 0) % 10 > 2 && (region === 1 || region === 4))
          xOffset = -20;
        if ((params.tooth_id || 0) % 10 > 2 && (region === 2 || region === 3))
          xOffset = 20;
      }
      let yOffset = 100;
      if (
        typeof params.yOffset !== "undefined" &&
        parseInt(String(params.yOffset)) !== 0
      )
        yOffset = Number(params.yOffset);
      if (region > 2) yOffset = 0 - yOffset;

      if (
        params.current_state &&
        (stateConfig as any)[params.current_state.state_pid]
      ) {
        const sc = (stateConfig as any)[
          params.current_state.state_pid
        ] as any[];
        sc.forEach((s) => {
          if (params.current_state && params.current_state.part === s.part) {
            if (typeof s.offsetY !== "undefined") {
              if (Number(params.tooth_id) > 30) yOffset += s.offsetY;
              else yOffset -= s.offsetY;
            }
          }
        });
      }

      const angle = params.angle || "vertical";
      if (angle === "circular") {
        switch ((params.tooth_id || 0) % 10) {
          case 1:
            xOffset = 10;
            yOffset = 100;
            break;
          case 2:
            xOffset = 40;
            yOffset = 100;
            break;
          case 3:
            xOffset = 80;
            yOffset = 100;
            break;
          case 4:
            xOffset = 100;
            yOffset = 40;
            break;
          case 5:
            xOffset = 100;
            yOffset = 30;
            break;
          case 6:
            xOffset = 100;
            yOffset = 20;
            break;
          case 7:
            xOffset = 100;
            yOffset = 10;
            break;
          case 8:
            xOffset = 100;
            yOffset = 0;
            break;
        }
        if (region === 2) xOffset = -xOffset;
        if (region === 3) {
          xOffset = -xOffset;
          yOffset = -yOffset;
        }
        if (region === 4) yOffset = -yOffset;
      }
      return { xOffset, yOffset };
    },
    [getToothRegion, stateConfig]
  );

  // -----------------------------
  // Scale calculation
  // -----------------------------
  const calculateScale = useCallback(() => {
    const xScale = (window.innerWidth - 40) / 700;
    const yScale =
      (window.innerHeight - (playerParams?.controls ? 90 : 100)) / 1100;
    const s = Math.min(xScale, yScale);
    setScale(s < 0 ? 0.1 : s);
  }, [playerParams?.controls]);

  // -----------------------------
  // Queue loading (from prop or base64)
  // -----------------------------
  useEffect(() => {
    if (queue && Array.isArray(queue)) {
      setQueueData(queue);
      return;
    }
    if (queueDataBase64) {
      try {
        const txt = atob(queueDataBase64);
        const parsed = JSON.parse(txt);
        setQueueData(parsed);
      } catch (e) {
        console.error("Failed to parse queueDataBase64", e);
        setQueueData([]);
      }
    }
  }, [queue, queueDataBase64]);

  // -----------------------------
  // Preload images
  // -----------------------------
  useEffect(() => {
    if (!queueData.length) return;

    const files: string[] = [];
    const pushUnique = (p: string) => {
      if (!files.includes(p)) files.push(p);
    };

    pushUnique("base");
    pushUnique("base-mask");
    pushUnique("drill");
    pushUnique("shadow");
    toothIds.forEach((id) => pushUnique(`2/${id}`));
    queueData.forEach((q) => q.base?.forEach((b) => pushUnique(b.src)));

    setFilesTotal(files.length);
    setFilesLoaded(0);

    let loaded = 0;
    files.forEach((f) => {
      const img = new Image();
      img.src = `https://static.bright-plans.com/3d-player/${f}.png`;
      img.onload = () => {
        loaded += 1;
        setFilesLoaded(loaded);
      };
      img.onerror = () => {
        loaded += 1;
        setFilesLoaded(loaded);
      };
    });
  }, [queueData, toothIds]);

  useEffect(() => {
    if (filesTotal === 0) return;
    const pct = Math.ceil((filesLoaded / filesTotal) * 100);
    setLoadedPct(pct);
    if (filesLoaded === filesTotal) {
      setPlayerState("loaded");
      setLoading(false);
    } else if (playerState !== "loading") {
      setPlayerState("loading");
    }
  }, [filesLoaded, filesTotal]);

  // -----------------------------
  // Build scene on mount and step changes
  // -----------------------------

  const clearScene = useCallback(() => {
    // Stop all running animations
    infoBoxControls.stop();
    stepEndControls.stop();
    group1Controls.stop();

    // Reset refs & state
    animationItemsRef.current = {};
    // setAnimationSequences(0);
    setScene([]);
  }, []);

  // Add near the other helpers (e.g. after getAngleOffsets) --------------------------------
  // const computeTeethPositions = useCallback(() => {
  //   // Scene box reference size (these match your scene Box width/height)
  //   const sceneW = 700;
  //   const sceneH = 1100;

  //   // Centers for the arcs (tune these if artwork uses different alignment)
  //   const upperCenter = { x: sceneW / 2, y: 260 }; // center of upper jaw arc
  //   const lowerCenter = { x: sceneW / 2, y: 840 }; // center of lower jaw arc

  //   // Radii for the arcs (tune)
  //   const upperRadius = 300; // how "wide" the upper arc is
  //   const lowerRadius = 300; // how "wide" the lower arc is

  //   // Angles (in degrees) span for upper arc (leftmost -> rightmost)
  //   // We choose 200° -> 340° for the top arc (goes above the center)
  //   const degToRad = (d: number) => (d * Math.PI) / 180;
  //   const upperStart = degToRad(200);
  //   const upperEnd = degToRad(340);

  //   // Lower arc (leftmost -> rightmost) below center: 20° -> 160°
  //   const lowerStart = degToRad(20);
  //   const lowerEnd = degToRad(160);

  //   // Ordering arrays: left-to-right for rendering (you can flip if needed)
  //   const upperOrder = [
  //     28,
  //     27,
  //     26,
  //     25,
  //     24,
  //     23,
  //     22,
  //     21, // upper-left (left of midline)
  //     11,
  //     12,
  //     13,
  //     14,
  //     15,
  //     16,
  //     17,
  //     18, // upper-right (right of midline)
  //   ];
  //   const lowerOrder = [
  //     38,
  //     37,
  //     36,
  //     35,
  //     34,
  //     33,
  //     32,
  //     31, // lower-left
  //     41,
  //     42,
  //     43,
  //     44,
  //     45,
  //     46,
  //     47,
  //     48, // lower-right
  //   ];

  //   // Assumed tooth image dimensions (half extents used to center image at computed point).
  //   // Tweak these values to match the actual tooth PNG dimensions (visual centering).
  //   const toothImgW = 120;
  //   const toothImgH = 160;

  //   const res: Record<number, { x: number; y: number; z: number }> = {};

  //   // helper for linear interpolation of angles
  //   const lerpAngle = (start: number, end: number, i: number, n: number) =>
  //     start + (i / (n - 1 || 1)) * (end - start);

  //   // upper: 16 positions
  //   for (let i = 0; i < upperOrder.length; i++) {
  //     const toothId = upperOrder[i];
  //     const angle = lerpAngle(upperStart, upperEnd, i, upperOrder.length);
  //     const px = upperCenter.x + upperRadius * Math.cos(angle);
  //     const py = upperCenter.y + upperRadius * Math.sin(angle);

  //     res[toothId] = {
  //       x: Math.round(px - toothImgW / 2),
  //       y: Math.round(py - toothImgH / 2),
  //       z: 1000, // above base jaw
  //     };
  //   }

  //   // lower: 16 positions
  //   for (let i = 0; i < lowerOrder.length; i++) {
  //     const toothId = lowerOrder[i];
  //     const angle = lerpAngle(lowerStart, lowerEnd, i, lowerOrder.length);
  //     const px = lowerCenter.x + lowerRadius * Math.cos(angle);
  //     const py = lowerCenter.y + lowerRadius * Math.sin(angle);

  //     res[toothId] = {
  //       x: Math.round(px - toothImgW / 2),
  //       y: Math.round(py - toothImgH / 2),
  //       z: 1000,
  //     };
  //   }

  //   return res;
  // }, []);
  const computeTeethPositions = useCallback(() => {
    // container size used in your JSX (700x1100)
    const sceneW = 700;
    const sceneH = 1100;

    // Tweak these to match artwork
    const upperCenter = { x: sceneW / 2, y: 260 }; // center of upper arc
    const lowerCenter = { x: sceneW / 2, y: 760 }; // center of lower arc
    const upperRadius = 320; // how far teeth sit from the upper arc center
    const lowerRadius = 320;

    const degToRad = (d: number) => (d * Math.PI) / 180;

    // Upper arc: sweep left -> right (angles chosen so arc sits above center)
    // Adjust start/end angles to tune curvature
    const upperStart = degToRad(200);
    const upperEnd = degToRad(340);

    // Lower arc: sweep left -> right (arc sits below center)
    const lowerStart = degToRad(20);
    const lowerEnd = degToRad(160);

    // Ordering: left-to-right so teeth align visually with jaw
    const upperOrder = [
      28,
      27,
      26,
      25,
      24,
      23,
      22,
      21, // upper-left
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18, // upper-right
    ];
    const lowerOrder = [
      38,
      37,
      36,
      35,
      34,
      33,
      32,
      31, // lower-left
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48, // lower-right
    ];

    // Visual size of the tooth (used to center the PNG at computed point).
    // Tweak these to match your tooth PNGs (or measure automatically).
    const toothImgW = 120;
    const toothImgH = 160;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const res: Record<number, { x: number; y: number; z: number }> = {};

    const fillArc = (
      order: number[],
      start: number,
      end: number,
      center: { x: number; y: number },
      radius: number
    ) => {
      const n = order.length;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const angle = lerp(start, end, t);
        const px = center.x + radius * Math.cos(angle);
        const py = center.y + radius * Math.sin(angle);
        const id = order[i];
        res[id] = {
          x: Math.round(px - toothImgW / 2),
          y: Math.round(py - toothImgH / 2),
          z: 1000, // default z (we will use dynamic z-index later)
        };
      }
    };

    fillArc(upperOrder, upperStart, upperEnd, upperCenter, upperRadius);
    fillArc(lowerOrder, lowerStart, lowerEnd, lowerCenter, lowerRadius);

    return res;
  }, []);

  // -----------------------------------------------------------------------------------------

  // const buildScene = useCallback(
  //   (stepIndex: number) => {
  //     stepStartedRef.current = new Date();
  //     const base: SceneObj[] = [
  //       {
  //         src: "drill",
  //         hidden: "1",
  //         position: { z: 9999 },
  //         unique_key: "drill",
  //         tool: "drill",
  //       },
  //       {
  //         src: "laser",
  //         hidden: "1",
  //         position: { z: 9999 },
  //         unique_key: "laser",
  //         tool: "laser",
  //       },
  //       // Add all teeth (hidden by default)
  //       ...toothIds.map((id) => ({
  //         src: `1/${id}`,
  //         position: {
  //           ...toothPositions[id as keyof typeof toothPositions],
  //           z: 1000,
  //         },
  //         unique_key: `tooth_${id}`,
  //         tooth_id: id,
  //       })),
  //     ];
  //     const step = queueData[stepIndex];
  //     const full = [...base, ...(step?.base || [])].map((s) => ({
  //       ...s,
  //       loaded: false,
  //     }));
  //     setScene(full);
  //   },
  //   [queueData, toothIds]
  // );

  // const buildScene = useCallback(
  //   (stepIndex: number) => {
  //     stepStartedRef.current = new Date();

  //     // compute positions programmatically
  //     const positions = computeTeethPositions();

  //     // base elements (tools + teeth - teeth will receive generated positions)
  //     const base: SceneObj[] = [
  //       {
  //         src: "drill",
  //         hidden: "1",
  //         position: { z: 9999 },
  //         unique_key: "drill",
  //         tool: "drill",
  //       },
  //       {
  //         src: "laser",
  //         hidden: "1",
  //         position: { z: 9999 },
  //         unique_key: "laser",
  //         tool: "laser",
  //       },
  //       // Add all teeth - assign computed positions
  //       ...toothIds.map((id) => ({
  //         src: `1/${id}`,
  //         position: {
  //           // override any previous data and use computed positions if available
  //           x: positions[id]?.x ?? 0,
  //           y: positions[id]?.y ?? 0,
  //           z: positions[id]?.z ?? 1000,
  //         },
  //         unique_key: `tooth_${id}`,
  //         tooth_id: id,
  //       })),
  //     ];

  //     const step = queueData[stepIndex];
  //     const full = [...base, ...(step?.base || [])].map((s) => ({
  //       ...s,
  //       loaded: false,
  //     }));
  //     setScene(full);
  //   },
  //   [queueData, toothIds, computeTeethPositions]
  // );

  const buildScene = useCallback(
    (stepIndex: number) => {
      stepStartedRef.current = new Date();

      const positions = computeTeethPositions();

      const base: SceneObj[] = [
        {
          src: "drill",
          hidden: "1",
          position: { z: 9999 },
          unique_key: "drill",
          tool: "drill",
        },
        {
          src: "laser",
          hidden: "1",
          position: { z: 9999 },
          unique_key: "laser",
          tool: "laser",
        },
        // teeth: use computed positions
        ...toothIds.map((id) => {
          const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
          // left side teeth: quadrants 2 & 3 -> optionally mirror if your PNGs face right
          const region = Math.floor(id / 10);
          const flip = region === 2 || region === 3;

          // compute a dynamic zIndex so nearer teeth overlap farther ones naturally
          // Higher zIndex for teeth closer to viewer (larger number = on top)
          const dynamicZ = Math.round(3000 - (pos.y ?? 0));

          return {
            src: `1/${id}`,
            position: { x: pos.x, y: pos.y, z: dynamicZ },
            unique_key: `tooth_${id}`,
            tooth_id: id,
            // runtime-only flag: TypeScript won't complain if we cast
            // we'll add flip as an ad-hoc property for rendering transform
            ...(flip ? ({ flip: true } as any) : {}),
          } as SceneObj & { flip?: boolean };
        }),
      ];

      const step = queueData[stepIndex];
      const full = [...base, ...(step?.base || [])].map((s) => ({
        ...s,
        loaded: false,
      }));
      setScene(full);
    },
    [queueData, toothIds, computeTeethPositions]
  );

  const updateTitle = useCallback(
    (stepIndex: number) => {
      setPrevTitle((prev) => {
        const nextTitle = queueData[stepIndex]?.title ?? prev;
        setTitle(nextTitle);
        return prev;
      });
    },
    [queueData]
  );

  useEffect(() => {
    if (!queueData.length) return;
    buildScene(0);
    updateTitle(0);
  }, [queueData, buildScene, updateTitle]);

  useEffect(() => {
    calculateScale();
    const onResize = () => {
      calculateScale();
    };
    window.addEventListener("resize", onResize);
    // orientation
    const onOrientation = () => {
      setTimeout(calculateScale, 250);
    };
    window.addEventListener("orientationchange", onOrientation);

    // postMessage API
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === "https://bright-plans.com" ||
        event.origin === "https://offer.bright-plans.com"
      ) {
        if (event.data === "pausePlay") pausePlay();
        if (event.data === "startPlay") startPlay();
        if (event.data === "stopPlay") stopPlay();
        if (event.data === "restart") restart();
      }
    };
    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("message", onMessage);
    };
  }, [calculateScale]);

  // -----------------------------
  // Player state effects
  // -----------------------------
  useEffect(() => {
    if (playerState === "loaded" && autoplay) {
      startPlay();
    }
    // dispatch custom event parity (optional):
    const ev = new CustomEvent("playerStateChanged", {
      detail: { state: playerState },
      bubbles: true,
    });
    document.dispatchEvent(ev);
  }, [playerState]);

  useEffect(() => {
    // On step change
    clearScene();
    updateTitle(currentStep);
    buildScene(currentStep);
    if (autoplay) runSceneAnimations(currentStep);

    try {
      const step = queueData[currentStep];
      const ev = new CustomEvent("playerStepChanged", {
        detail: { step: currentStep, idx: step?.procedureIdx },
        bubbles: true,
      });
      document.dispatchEvent(ev);
    } catch {}
  }, [currentStep]);

  // -----------------------------
  // Player Controls
  // -----------------------------
  const startPlay = useCallback(() => {
    setPlayerState("playing");

    if (animationSequences > 0) {
      // Resume all ongoing animations
      infoBoxControls.start({}); // empty start continues paused animations
      stepEndControls.start({});
      group1Controls.start({});
    } else {
      setAutoplay(true);
      if (currentStep === 0) setCurrentStep(1);
      else runSceneAnimations(currentStep); // define this using Framer Motion
    }

    try {
      const step = (queueData as any)?.current[currentStep];
      const ev = new CustomEvent("playerStepChanged", {
        detail: { step: currentStep, idx: step?.procedureIdx },
        bubbles: true,
      });
      document.dispatchEvent(ev);
    } catch {}
  }, [animationSequences, currentStep, queueData]);

  const pausePlay = useCallback(() => {
    // Framer Motion doesn't have "pause", but we can use stop()
    infoBoxControls.stop();
    stepEndControls.stop();
    group1Controls.stop();
    setPlayerState("paused");
  }, []);

  const stopPlay = useCallback(() => {
    setAutoplay(false);
    setPlayerState("stopped");
    clearScene();
    updateTitle(currentStep);
    buildScene(currentStep);
  }, [clearScene, updateTitle, buildScene, currentStep]);

  const restart = useCallback(() => {
    setAutoplay(true);
    setCurrentStep(0);
  }, []);

  const prevStep = useCallback(() => {
    setAutoplay(false);
    setPlayerState("stopped");
    setCurrentStep((s) => (s === 0 ? 0 : s - 1));
  }, []);

  //   const nextStep = useCallback(() => {
  //     setCurrentStep((s) => (s + 1 === queueData.length ? s : s + 1));
  //   }, [queueData.length]);

  const onAnimationFinished = useCallback(() => {
    const start = stepStartedRef.current?.getTime() || 0;
    const res = Math.abs(Date.now() - start) / 1000;
    if (autoplay && queueData.length > currentStep + 1) {
      setPlayerState("playing");
      //   nextStep();
    } else if (queueData.length === currentStep + 1) {
      setAutoplay(false);
      setPlayerState("finished");
    } else if (!autoplay) {
      setPlayerState("paused");
    }
  }, [autoplay, currentStep, queueData.length]);

  // -----------------------------
  // Animation plumbing
  // -----------------------------
  const getElementForAnimation = useCallback(
    (params?: StepAnimation | "prev-title") => {
      let el: HTMLElement | null = null;
      let key = "";
      if (!params) {
        el = infoBoxRef.current;
        key = "info-box";
      } else if (params === "prev-title") {
        el = infoPrevRef.current;
        key = "info-box-prev";
      } else if ((params as StepAnimation).tool) {
        const tool = (params as StepAnimation).tool as string;
        el = document.getElementById("scene_layer_" + tool);
        key = tool;
      } else {
        const uniq = (params as StepAnimation).unique_key as string;
        el = document.getElementById("scene_layer_" + uniq);
        key = "scene_layer_" + uniq;
      }
      if (!animationItemsRef.current[key]) animationItemsRef.current[key] = [];
      return { el, key } as const;
    },
    []
  );

  const runSceneAnimations = useCallback(
    (stepIndex: number) => {
      const step = queueData[stepIndex];
      animationItemsRef.current = {};
      setTimeout(() => {
        if (step?.animations && step.animations.length > 0) {
          setPlayerState("playing");
          setAnimationSequences(step.animations.length);
          // dispatch by callback name
          step.animations.forEach((a) => {
            const fn = (animationDispatch as any)[a.callback];
            if (typeof fn === "function") fn(a);
          });
          // run sequences
          Object.keys(animationItemsRef.current).forEach((k) => {
            const seq = animationItemsRef.current[k];
            if (Array.isArray(seq) && seq.length) runSequence(seq);
          });
        } else {
          //   setAnimationSequences(0);
          //   if (autoplay) nextStep();
        }
      });
    },
    [queueData, autoplay]
  );

  // Individual animation runners (ported)
  const runTitleFadeInAnimation = useCallback(
    (params: StepAnimation) => {
      const fadeDuration = 900;
      const prev = getElementForAnimation("prev-title");
      const cur = getElementForAnimation();
      if (!prev.el || !cur.el) return;

      if (prev.el.innerHTML === cur.el.innerHTML) {
        animationItemsRef.current[prev.key].push({
          e: prev.el,
          p: { opacity: 0, translateY: 0 },
          o: { duration: 1, delay: 0 },
        });
        animationItemsRef.current[cur.key].push({
          e: cur.el,
          p: { opacity: 1, translateY: 0 },
          o: { duration: 1, delay: 0 },
        });
        return;
      }

      animationItemsRef.current[prev.key].push({
        e: prev.el,
        p: { opacity: 0, translateY: 90 },
        o: {
          duration: fadeDuration,
          delay: params.start,
          queue: false,
          sequenceQueue: false,
          easing: getFPSLimitedSteps(fadeDuration, maxFPS),
        },
      });
      animationItemsRef.current[cur.key].push({
        e: cur.el,
        p: { opacity: 0, translateY: -90 },
        o: { duration: 1, delay: 0 },
      });
      animationItemsRef.current[cur.key].push({
        e: cur.el,
        p: { opacity: 1, translateY: 0 },
        o: {
          duration: fadeDuration,
          delay: (params.start || 0) + 10,
          queue: false,
          sequenceQueue: false,
          easing: getFPSLimitedSteps(fadeDuration, maxFPS),
        },
      });
    },
    [getElementForAnimation, getFPSLimitedSteps]
  );

  const runStepEndAnimation = useCallback(
    (params: StepAnimation) => {
      if (!stepEndRef.current) return;
      const key = "step-end";
      animationItemsRef.current[key] = [];
      animationItemsRef.current[key].push({
        e: stepEndRef.current,
        p: { opacity: 0 },
        o: {
          duration: 0,
          delay: (params.start || 0) + 500,
          queue: false,
          complete: () => onAnimationFinished(),
        },
      });
    },
    [onAnimationFinished]
  );

  const runFadeInAnimation = useCallback(
    (params: StepAnimation) => {
      const { el, key } = getElementForAnimation(params);
      if (!el) return;
      const effect = { ...(params.effect || {}), opacity: 1 };
      const fadeDuration = params.fadeDuration
        ? Number(params.fadeDuration)
        : 1500;
      animationItemsRef.current[key].push({
        e: el,
        p: { opacity: 0 },
        o: { duration: 0, delay: 0, queue: false, sequenceQueue: false },
      });
      animationItemsRef.current[key].push({
        e: el,
        p: effect,
        o: {
          duration: fadeDuration,
          delay: params.start || 0,
          easing: getFPSLimitedSteps(fadeDuration, maxFadeFPS),
        },
      });
    },
    [getElementForAnimation, getFPSLimitedSteps]
  );

  const runFadeOutAnimation = useCallback(
    (params: StepAnimation) => {
      const { el, key } = getElementForAnimation(params);
      if (!el) return;
      const effect = { ...(params.effect || {}), opacity: 0 };
      const fadeDuration = params.fadeDuration
        ? Number(params.fadeDuration)
        : 1500;
      animationItemsRef.current[key].push({
        e: el,
        p: effect,
        o: {
          duration: fadeDuration,
          delay: params.start || 0,
          queue: false,
          sequenceQueue: false,
          easing: getFPSLimitedSteps(fadeDuration, maxFadeFPS),
        },
      });
    },
    [getElementForAnimation, getFPSLimitedSteps]
  );

  const runInsertAnimation = useCallback(
    (params: StepAnimation) => {
      const group = params.groupId && params.groupId > 0;
      let el: HTMLElement | null = null;
      let key = "";
      if (group) {
        el = group1Ref.current;
        key = "scene_layer_group_1";
        if (!animationItemsRef.current[key])
          animationItemsRef.current[key] = [];
        params.unique_key = "group_1";
      } else {
        const found = getElementForAnimation(params);
        el = found.el;
        key = found.key;
      }
      if (!el) return;

      const { xOffset, yOffset } = getAngleOffsets(params);
      const fadeDuration = params.fadeDuration
        ? Number(params.fadeDuration)
        : 500;
      const moveDelay = params.moveDelay ? Number(params.moveDelay) : 500;
      const moveDuration = params.moveDuration
        ? Number(params.moveDuration)
        : 1500;

      animationItemsRef.current[key].push({
        e: el,
        p: { opacity: 0, translateY: yOffset, translateX: xOffset },
        o: { duration: 0, delay: 0 },
      });
      animationItemsRef.current[key].push({
        e: el,
        p: { opacity: 1 },
        o: {
          queue: false,
          sequenceQueue: false,
          duration: fadeDuration,
          delay: params.start || 0,
          easing: getFPSLimitedSteps(fadeDuration, maxFadeFPS),
        },
      });
      animationItemsRef.current[key].push({
        e: el,
        p: { translateY: 0, translateX: 0 },
        o: {
          duration: moveDuration,
          delay: moveDelay,
          easing: getFPSLimitedSteps(moveDuration, maxMoveFPS),
        },
      });
    },
    [getElementForAnimation, getAngleOffsets, getFPSLimitedSteps]
  );

  const runRemoveAnimation = useCallback(
    (params: StepAnimation) => {
      const { el, key } = getElementForAnimation(params);
      if (!el) return;
      const { xOffset, yOffset } = getAngleOffsets(params);
      const fadeDuration = params.fadeDuration
        ? Number(params.fadeDuration)
        : 500;
      const moveDelay = params.moveDelay ? Number(params.moveDelay) : 500;
      const moveDuration = params.moveDuration
        ? Number(params.moveDuration)
        : 1500;
      animationItemsRef.current[key].push({
        e: el,
        p: { translateY: yOffset, translateX: xOffset },
        o: {
          duration: moveDuration,
          delay: params.start || 0,
          easing: getFPSLimitedSteps(moveDuration, maxMoveFPS),
        },
      });
      animationItemsRef.current[key].push({
        e: el,
        p: { opacity: 0 },
        o: {
          duration: fadeDuration,
          delay: moveDelay,
          queue: false,
          easing: getFPSLimitedSteps(fadeDuration, maxFadeFPS),
        },
      });
    },
    [getElementForAnimation, getAngleOffsets, getFPSLimitedSteps]
  );

  const runRemoveFadeAnimation = useCallback(
    (params: StepAnimation) => {
      const { el, key } = getElementForAnimation(params);
      if (!el) return;
      const { xOffset, yOffset } = getAngleOffsets(params);
      const fadeDuration = params.fadeDuration
        ? Number(params.fadeDuration)
        : 500;
      const moveDelay = params.moveDelay ? Number(params.moveDelay) : 500;
      const moveDuration = params.moveDuration
        ? Number(params.moveDuration)
        : 1500;
      animationItemsRef.current[key].push({
        e: el,
        p: { translateY: yOffset, translateX: xOffset },
        o: {
          duration: moveDuration,
          delay: params.start || 0,
          queue: false,
          easing: getFPSLimitedSteps(moveDuration, maxMoveFPS),
        },
      });
      animationItemsRef.current[key].push({
        e: el,
        p: { opacity: 0 },
        o: {
          duration: fadeDuration,
          delay: moveDelay,
          queue: false,
          sequenceQueue: false,
          easing: getFPSLimitedSteps(fadeDuration, maxFadeFPS),
        },
      });
    },
    [getElementForAnimation, getAngleOffsets, getFPSLimitedSteps]
  );

  const runShowToolAnimation = useCallback(
    (params: StepAnimation) => {
      if (!params.tool) return;
      const start = params.start || 0;
      const pos = getDrillPosition(params.tooth_id);
      const { el } = getElementForAnimation(params);
      if (!el || !pos) return;
      const region = getToothRegion(params.tooth_id || 0);
      const jaw = region < 3 ? "upper" : "lower";
      const transform = getToolTransformations(region);

      setStateMap((m) => ({
        ...m,
        [`${params.tool}FirstRegion`]: region,
        [`${params.tool}LastJaw`]: jaw,
      }));

      animationItemsRef.current[params.tool!].push({
        e: el,
        p: {
          opacity: 0,
          translateX: pos.x,
          translateY: region > 2 ? pos.y - 100 : pos.y + 100,
          rotateZ: transform.rotateZ,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
        },
        o: { queue: false, sequenceQueue: false, duration: 100, delay: 0 },
      });
      animationItemsRef.current[params.tool!].push({
        e: el,
        p: { opacity: 1 },
        o: {
          duration: params.fadeDuration || 300,
          delay: start,
          easing: getFPSLimitedSteps(params.fadeDuration || 300, maxFadeFPS),
        },
      });
    },
    [
      getDrillPosition,
      getElementForAnimation,
      getToolTransformations,
      getFPSLimitedSteps,
      getToothRegion,
    ]
  );

  const runChangeToolJawAnimation = useCallback(
    (params: StepAnimation) => {
      if (!params.tool) return;
      const { el } = getElementForAnimation(params);
      if (!el) return;
      const pos = getDrillPosition(params.tooth_id);
      const region = getToothRegion(params.tooth_id || 0);
      const transform = getToolTransformations(region);

      animationItemsRef.current[params.tool].push({
        e: el,
        p: { translateY: "+=100", opacity: 0 },
        o: {
          duration: 500,
          queue: false,
          easing: getFPSLimitedSteps(500, maxMoveFPS),
        },
      });
      animationItemsRef.current[params.tool].push({
        e: el,
        p: {
          rotateZ: transform.rotateZ,
          scaleX: transform.scaleX,
          scaleY: transform.scaleY,
          translateY: (pos?.y || 0) - 100,
          translateX: pos?.x || 0,
        },
        o: { duration: 0 },
      });
      animationItemsRef.current[params.tool].push({
        e: el,
        p: { opacity: 1 },
        o: {
          duration: 500,
          delay: 0,
          easing: getFPSLimitedSteps(500, maxFadeFPS),
        },
      });
      animationItemsRef.current[params.tool].push({
        e: el,
        p: { translateY: "+=100" },
        o: { duration: 500, easing: getFPSLimitedSteps(500, maxMoveFPS) },
      });
    },
    [
      getElementForAnimation,
      getDrillPosition,
      getToolTransformations,
      getFPSLimitedSteps,
      getToothRegion,
    ]
  );

  const runToolAnimation = useCallback(
    (params: StepAnimation) => {
      if (!params.tool) return;
      const pos = getDrillPosition(params.tooth_id);
      const { el } = getElementForAnimation(params);
      if (!el || !pos) return;
      const region = getToothRegion(params.tooth_id || 0);

      // Compensation retained from original
      const firstRegion = (stateMap as any)[`${params.tool}FirstRegion`];
      if (region === 2 && Number(firstRegion) === 1) pos.x += 600;
      if (region === 3 && Number(firstRegion) === 4) pos.x += 600;

      const moveDuration = Number(params.moveDuration || 1000);
      const moveDelay = Number(params.moveDelay || 300);

      animationItemsRef.current[params.tool].push({
        e: el,
        p: { translateY: pos.y, translateX: pos.x },
        o: {
          duration: moveDuration,
          easing: getFPSLimitedSteps(moveDuration, maxMoveFPS),
        },
      });
      animationItemsRef.current[params.tool].push({
        e: el,
        p: { translateY: pos.y, translateX: pos.x },
        o: { easing: "ease-in-out", duration: moveDelay },
      });
    },
    [
      getElementForAnimation,
      getDrillPosition,
      getFPSLimitedSteps,
      getToothRegion,
      stateMap,
    ]
  );

  const runHideToolAnimation = useCallback(
    (params: StepAnimation) => {
      const { el } = getElementForAnimation(params);
      if (!el || !params.tool) return;
      const firstRegion = (stateMap as any)[`${params.tool}FirstRegion`];
      const translateY = Number(firstRegion) > 2 ? "-=100" : "+=100";
      animationItemsRef.current[params.tool].push({
        e: el,
        p: { translateY, opacity: 0 },
        o: {
          duration: 500,
          queue: false,
          easing: getFPSLimitedSteps(
            Number(params.moveDuration || 500),
            maxFadeFPS
          ),
        },
      });
    },
    [getElementForAnimation, getFPSLimitedSteps, stateMap]
  );

  // Dispatch map
  const animationDispatch: Record<string, (p: StepAnimation) => void> = useMemo(
    () => ({
      runTitleFadeInAnimation,
      runStepEndAnimation,
      runFadeInAnimation,
      runFadeOutAnimation,
      runInsertAnimation,
      runRemoveAnimation,
      runRemoveFadeAnimation,
      runShowToolAnimation,
      runChangeToolJawAnimation,
      runToolAnimation,
      runHideToolAnimation,
      runDummyAnimation: () => {},
    }),
    [
      runTitleFadeInAnimation,
      runStepEndAnimation,
      runFadeInAnimation,
      runFadeOutAnimation,
      runInsertAnimation,
      runRemoveAnimation,
      runRemoveFadeAnimation,
      runShowToolAnimation,
      runChangeToolJawAnimation,
      runToolAnimation,
      runHideToolAnimation,
    ]
  );

  // -----------------------------
  // Render helpers
  // -----------------------------
  // const getSceneObjectStyle = (sceneObj: SceneObj): React.CSSProperties => {
  //   const styles: React.CSSProperties = {
  //     position: "absolute",
  //     willChange: "opacity, top, left, transform",
  //   };
  //   if (sceneObj.position?.x !== undefined) styles.left = sceneObj.position.x;
  //   else styles.left = 0;
  //   if (sceneObj.position?.y !== undefined) styles.top = sceneObj.position.y;
  //   else styles.top = 0;
  //   if (sceneObj.position?.z !== undefined) styles.zIndex = sceneObj.position.z;
  //   if (
  //     sceneObj.hidden === "1" ||
  //     sceneObj.hidden === 1 ||
  //     sceneObj.hidden === "true" ||
  //     sceneObj.hidden === true
  //   )
  //     styles.opacity = 0;
  //   return styles;
  // };
  const getSceneObjectStyle = (
    sceneObj: SceneObj & { flip?: boolean }
  ): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: "absolute",
      willChange: "opacity, top, left, transform",
      transformOrigin: "center center",
    };

    if (sceneObj.position?.x !== undefined)
      styles.left = `${sceneObj.position.x}px`;
    else styles.left = "0px";

    if (sceneObj.position?.y !== undefined)
      styles.top = `${sceneObj.position.y}px`;
    else styles.top = "0px";

    // Prefer explicit z from position if provided, else fallback to 1000
    if (typeof sceneObj.position?.z !== "undefined")
      styles.zIndex = sceneObj.position.z;
    else styles.zIndex = 1000;

    if (
      sceneObj.hidden === "1" ||
      sceneObj.hidden === 1 ||
      sceneObj.hidden === "true" ||
      sceneObj.hidden === true
    ) {
      styles.opacity = 0;
    }

    // apply flip if present (left-side teeth)
    // avoid clobbering animations that may set transform; animations will combine transforms,
    // but for now set simple scaleX flipping
    if ((sceneObj as any).flip) {
      styles.transform = "scaleX(-1)";
    }

    return styles;
  };

  return (
    <Box
      id="main3d"
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Box>
        <Box
          id="scene"
          sx={{
            position: "relative",
            transform: `scale(${scale})`,
            willChange: "transform",
            transformOrigin: "top center",
            width: 700,
            height: 1100,
            m: "0 auto",
          }}
        >
          {/* Base jaw image */}
          <Box
            component="img"
            id="scene_layer_base"
            src="https://static.bright-plans.com/3d-player/base.png"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 0,
            }}
          />

          {/* Teeth - rendered above base jaw */}
          {scene
            .filter((o) => o.unique_key?.startsWith("tooth_"))
            .map((sceneObj) => (
              <Box
                component="img"
                key={sceneObj.unique_key}
                id={`scene_layer_${sceneObj.unique_key}`}
                src={`https://static.bright-plans.com/3d-player/${sceneObj.src}.png`}
                style={getSceneObjectStyle(sceneObj)}
              />
            ))}

          {/* Base mask (if needed) */}
          <Box
            component="img"
            id="scene_layer_base_mask"
            src="https://static.bright-plans.com/3d-player/base-mask.png"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 500,
            }}
          />

          {/* Other objects (tools, etc.) */}
          {scene
            .filter(
              (o) =>
                !o.unique_key?.startsWith("tooth_") &&
                o.unique_key !== "base" &&
                o.unique_key !== "base-mask"
            )
            .map((sceneObj) => (
              <Box
                component="img"
                key={sceneObj.unique_key}
                id={`scene_layer_${sceneObj.unique_key}`}
                src={`https://static.bright-plans.com/3d-player/${sceneObj.src}.png`}
                style={getSceneObjectStyle(sceneObj)}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
};

export default PmAnimationViewerReact;
