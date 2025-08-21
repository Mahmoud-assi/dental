import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import { BASE_URL } from "./general/constants";
import type { SceneObj } from "./general/types";
import { getSceneObjectStyle, getToothRegion } from "./general/utils";

interface ToothAnimationProps {
  scene: SceneObj[];
  animatedTeethVisible: boolean;
  activeToothId?: number;
  duration?: number;
}

export default function ToothAnimation({
  scene,
  animatedTeethVisible,
  activeToothId,
  duration = 1.5,
}: ToothAnimationProps) {
  return (
    <Box>
      {scene
        .filter((o) => o.animated)
        .map((sceneObj) => {
          const toothId = sceneObj.tooth_id;
          const region = toothId ? getToothRegion(toothId) : 0;
          const isUpperTooth = region === 1 || region === 2;
          const isLowerTooth = region === 3 || region === 4;

          // Set initial Y position for animation
          const initialY = isUpperTooth ? 100 : isLowerTooth ? -100 : 0;

          // Only animate if this is the active tooth OR no specific tooth is specified
          const shouldAnimate = !activeToothId || toothId === activeToothId;

          return (
            <Box
              component={motion.img}
              key={sceneObj.unique_key}
              id={`scene_layer_${sceneObj.unique_key}`}
              src={`${BASE_URL}${sceneObj.src}.png`}
              initial={{
                opacity: 0,
                y: initialY,
              }}
              animate={{
                opacity: animatedTeethVisible && shouldAnimate ? 1 : 0,
                y: animatedTeethVisible && shouldAnimate ? 0 : initialY,
              }}
              transition={{
                duration: duration,
                ease: "easeInOut",
                opacity: { duration: duration * 0.7, ease: "easeInOut" },
                y: { duration: duration, ease: "easeOut" },
              }}
              sx={{
                ...getSceneObjectStyle(sceneObj),
                // Ensure hidden teeth stay hidden when not animated
                display:
                  animatedTeethVisible && shouldAnimate ? "block" : "none",
              }}
            />
          );
        })}
    </Box>
  );
}
