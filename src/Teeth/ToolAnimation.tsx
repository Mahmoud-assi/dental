import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import { BASE_URL } from "./general/constants";
import type { SceneObj } from "./general/types";
import {
  getSceneObjectStyle,
  getDrillPosition,
  getToothRegion,
  getToolTransformations,
} from "./general/utils";

interface ToolAnimationProps {
  scene: SceneObj[];
  activeToothId?: number;
  visible: boolean;
  tool?: "drill" | "laser";
  onAnimationComplete?(): void;
}

export default function ToolAnimation({
  scene,
  activeToothId = 48,
  visible,
  tool = "drill",
  onAnimationComplete,
}: ToolAnimationProps) {
  const currentTool = scene.find((o) => o.tool === tool);
  const [showDrill, setShowDrill] = useState(visible);
  const [currentRegion, setCurrentRegion] = useState<number | null>(null);
  const pos = getDrillPosition(activeToothId);
  const region = getToothRegion(activeToothId);
  const transform = getToolTransformations(region);
  const isUpperTooth = useMemo(() => region === 1 || region === 2, [region]);

  const initialY = useMemo(
    () => (isUpperTooth ? (pos?.y ?? 0) + 100 : (pos?.y ?? 0) - 100),
    [isUpperTooth, pos?.y]
  );

  useEffect(() => {
    if (visible) {
      // If region changed, don't show animation - create new instance instead
      if (currentRegion !== null && currentRegion !== region) {
        setShowDrill(false);
        setTimeout(() => {
          setCurrentRegion(region);
          setShowDrill(true);
        }, 50);
      } else {
        setCurrentRegion(region);
        setShowDrill(true);
      }
      const timer = setTimeout(() => {
        setShowDrill(false);
        onAnimationComplete?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, onAnimationComplete, region, currentRegion]);

  // Don't render if region changed and we're in the process of switching
  if (
    (currentRegion !== null && currentRegion !== region && showDrill) ||
    !currentTool
  )
    return null;

  return (
    <AnimatePresence>
      {showDrill && (
        <Box
          component={motion.img}
          key={`${currentTool.unique_key}_${region}`} // Unique key per region
          id={`scene_layer_${currentTool.unique_key}_${region}`}
          src={`${BASE_URL}${currentTool.src}.png`}
          initial={{
            opacity: 0,
            x: pos?.x ?? 0,
            y: initialY,
            scaleX: transform.scaleX,
            scaleY: transform.scaleY,
            rotateZ: transform.rotateZ,
          }}
          animate={{
            opacity: 1,
            x: pos?.x ?? 0,
            y: pos?.y ?? 0,
            scaleX: transform.scaleX,
            scaleY: transform.scaleY,
            rotateZ: transform.rotateZ,
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5 },
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
          sx={getSceneObjectStyle(currentTool)}
        />
      )}
    </AnimatePresence>
  );
}
