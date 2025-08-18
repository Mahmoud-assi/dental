import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import Box from "@mui/material/Box";
import type { PmAnimationViewerProps, SceneObj, Step } from "./types";

// @ts-ignore
const runSequence = async (seq: { controls: any; animation: any }[]) => {
  for (const step of seq) {
    await step.controls.start(step.animation);
  }
};

const PmAnimationViewerReact: FC<
  PmAnimationViewerProps & { debug?: boolean }
> = ({
  playerParams = { controls: true, language: "en" },
  queue,
  queueDataBase64,
  debug = false,
}) => {
  const [_, setLoading] = useState(true);
  const [__, setLoadedPct] = useState(0);
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesLoaded, setFilesLoaded] = useState(0);
  const [playerState, setPlayerState] = useState<
    "loading" | "loaded" | "playing" | "paused" | "stopped" | "finished" | null
  >(null);
  const [scale, setScale] = useState<number>(1);
  const [scene, setScene] = useState<SceneObj[]>([]);
  const [queueData, setQueueData] = useState<Step[]>([]);

  const stepStartedRef = useRef<Date | null>(null);

  const toothIds = useMemo(() => {
    const ids: number[] = [];
    for (let i = 1; i <= 4; i++) {
      for (let j = 1; j <= 8; j++) ids.push(i * 10 + j);
    }
    return ids;
  }, []);

  // manual offsets (persisted in localStorage)
  const [manualOffsets, setManualOffsets] = useState<
    Record<number, { dx: number; dy: number }>
  >(() => {
    try {
      const raw = localStorage.getItem("pm_tooth_offsets");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveOffsets = useCallback(
    (next: Record<number, { dx: number; dy: number }>) => {
      setManualOffsets(next);
      try {
        localStorage.setItem("pm_tooth_offsets", JSON.stringify(next));
      } catch {}
    },
    []
  );

  const dragRef = useRef<{
    id: number;
    base: { dx: number; dy: number };
    startX: number;
    startY: number;
  } | null>(null);

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

  // --- Tooth positions via ellipse ---
  const computeTeethPositions = useCallback(() => {
    const sceneW = 700;
    const sceneH = 1100;

    const upperCenter = { x: sceneW / 2, y: 260 };
    const lowerCenter = { x: sceneW / 2, y: 760 };
    const upperRadius = 320;
    const lowerRadius = 320;

    const degToRad = (d: number) => (d * Math.PI) / 180;

    const upperStart = degToRad(180); // leftmost
    const upperEnd = degToRad(360); // rightmost
    const lowerStart = degToRad(0);
    const lowerEnd = degToRad(180);

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

        const offset = manualOffsets[id] || { dx: 0, dy: 0 };

        res[id] = {
          x: Math.round(px - toothImgW / 2 + offset.dx),
          y: Math.round(py - toothImgH / 2 + offset.dy),
          z: 1000,
        };
      }
    };

    fillArc(upperOrder, upperStart, upperEnd, upperCenter, upperRadius);
    fillArc(lowerOrder, lowerStart, lowerEnd, lowerCenter, lowerRadius);

    return res;
  }, [manualOffsets]);

  // --- Build scene ---
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

  // --- Styles ---
  const getSceneObjectStyle = (sceneObj: SceneObj): React.CSSProperties => {
    const styles: React.CSSProperties = {
      position: "absolute",
      willChange: "opacity, top, left, transform",
    };
    if (sceneObj.position?.x !== undefined) styles.left = sceneObj.position.x;
    if (sceneObj.position?.y !== undefined) styles.top = sceneObj.position.y;
    if (sceneObj.position?.z !== undefined) styles.zIndex = sceneObj.position.z;
    if (
      sceneObj.hidden === "1" ||
      sceneObj.hidden === 1 ||
      sceneObj.hidden === "true" ||
      sceneObj.hidden === true
    )
      styles.opacity = 0;
    if (sceneObj.unique_key?.startsWith("tooth_")) {
      styles.transform = "translate(-50%,-50%)";
      styles.transformOrigin = "center center";
    }
    return styles;
  };

  // --- Scale ---
  const calculateScale = useCallback(() => {
    const xScale = (window.innerWidth - 40) / 700;
    const yScale =
      (window.innerHeight - (playerParams?.controls ? 90 : 100)) / 1100;
    const s = Math.min(xScale, yScale);
    setScale(s < 0 ? 0.1 : s);
  }, [playerParams?.controls]);

  useEffect(() => {
    calculateScale();
    const onResize = () => calculateScale();
    const onOrientation = () => setTimeout(calculateScale, 250);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
    };
  }, [calculateScale]);

  useEffect(() => {
    buildScene(0);
  }, [buildScene]);

  // --- Drag handlers ---
  const onToothMouseDown = useCallback(
    (id: number, e: React.MouseEvent) => {
      if (!debug) return;
      e.preventDefault();
      const base = manualOffsets[id] || { dx: 0, dy: 0 };
      dragRef.current = {
        id,
        base,
        startX: e.clientX,
        startY: e.clientY,
      };
    },
    [debug, manualOffsets]
  );

  useEffect(() => {
    if (!debug) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { id, base, startX, startY } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const temp = {
        ...manualOffsets,
        [id]: { dx: base.dx + dx, dy: base.dy + dy },
      };
      setManualOffsets(temp);
    };
    const onUp = () => {
      if (!dragRef.current) return;
      saveOffsets(manualOffsets);
      dragRef.current = null;
      buildScene(0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s") {
        const blob = new Blob([JSON.stringify(manualOffsets, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tooth-offsets.json";
        a.click();
        URL.revokeObjectURL(url);
      }
      if (e.key.toLowerCase() === "r") {
        saveOffsets({});
        buildScene(0);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [debug, manualOffsets, saveOffsets, buildScene]);

  // --- Render ---
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
            style={{ position: "absolute", left: 0, top: 0, zIndex: 0 }}
          />

          {/* Teeth */}
          {scene
            .filter((o) => o.unique_key?.startsWith("tooth_"))
            .map((sceneObj) => {
              const id = sceneObj.tooth_id!;
              return (
                <Box
                  component="img"
                  key={sceneObj.unique_key}
                  id={`scene_layer_${sceneObj.unique_key}`}
                  src={`https://static.bright-plans.com/3d-player/${sceneObj.src}.png`}
                  style={getSceneObjectStyle(sceneObj)}
                  onMouseDown={(e) => onToothMouseDown(id, e)}
                  sx={{ cursor: debug ? "move" : "default" }}
                />
              );
            })}

          {/* Debug dots */}
          {debug &&
            toothIds.map((id) => {
              const s = scene.find((o) => o.unique_key === `tooth_${id}`);
              if (!s?.position) return null;
              return (
                <Box
                  key={`dot_${id}`}
                  sx={{
                    position: "absolute",
                    left: s.position.x,
                    top: s.position.y,
                    transform: "translate(-50%, -50%)",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#ff3b30",
                    zIndex: 10000,
                    pointerEvents: "none",
                  }}
                  title={`${id}`}
                />
              );
            })}

          {/* Base mask */}
          <Box
            component="img"
            id="scene_layer_base_mask"
            src="https://static.bright-plans.com/3d-player/base-mask.png"
            style={{ position: "absolute", left: 0, top: 0, zIndex: 500 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PmAnimationViewerReact;
