import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import { BASE_URL, TEETH_POSITIONS } from "./general/constants";
import { getSceneObjectStyle, getToothRegion } from "./general/utils";
import type { SceneObj } from "./general/types";

interface ImplantAnimationProps {
  activeToothId: number;
  visible: boolean;
  onAnimationComplete?(): void;
  scene: SceneObj[];
}

export default function ImplantAnimation({
  activeToothId,
  visible,
  onAnimationComplete,
  scene,
}: ImplantAnimationProps) {
  const currentScene = scene.find((o) => o.type === "implant");

  const [currentStage, setCurrentStage] = useState<number>(0);
  const region = getToothRegion(activeToothId);
  const isUpperTooth = region === 1 || region === 2;
  const pos = TEETH_POSITIONS[activeToothId as keyof typeof TEETH_POSITIONS];
  const initialY = isUpperTooth ? pos.y + 100 : pos.y - 100;

  useEffect(() => {
    if (visible) {
      setCurrentStage(1);
      const stage1Timer = setTimeout(() => {
        setCurrentStage(2);
      }, 1000);
      const stage2Timer = setTimeout(() => {
        setCurrentStage(3);
      }, 2000);
      const completeTimer = setTimeout(() => {
        setCurrentStage(0);
        onAnimationComplete?.();
      }, 3000);
      return () => {
        clearTimeout(stage1Timer);
        clearTimeout(stage2Timer);
        clearTimeout(completeTimer);
      };
    }
  }, [visible, onAnimationComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {/* First Screw */}
      {currentStage >= 1 && (
        <Box
          component={motion.img}
          key={`screw1_${activeToothId}`}
          src={`${BASE_URL}11/${activeToothId}.png`}
          initial={{
            opacity: 0,
            x: pos.x,
            y: initialY,
          }}
          animate={{
            opacity: 1,
            x: pos.x,
            y: pos.y,
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5 },
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
          sx={{ ...getSceneObjectStyle(currentScene!), zIndex: 9999 + 1 }}
        />
      )}

      {/* Second Screw */}
      {currentStage >= 2 && (
        <Box
          component={motion.img}
          key={`screw2_${activeToothId}`}
          src={`${BASE_URL}13/${activeToothId}.png`}
          initial={{
            opacity: 0,
            x: pos.x,
            y: initialY,
          }}
          animate={{
            opacity: 1,
            x: pos.x,
            y: pos.y,
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5 },
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
          sx={{ ...getSceneObjectStyle(currentScene!), zIndex: 9999 + 1 }}
        />
      )}

      {/* Final Tooth */}
      {currentStage >= 3 && (
        <Box
          component={motion.img}
          key={`tooth_${activeToothId}`}
          src={`${BASE_URL}15/${activeToothId}.png`}
          initial={{
            opacity: 0,
            x: pos.x,
            y: initialY,
          }}
          animate={{
            opacity: 1,
            x: pos.x,
            y: pos.y,
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.5 },
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
          sx={getSceneObjectStyle(currentScene!)}
        />
      )}
    </AnimatePresence>
  );
}
