import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import { memo, useMemo } from "react";
import { BASE_URL } from "./general/constants";
import type { SceneObj } from "./general/types";
import { getSceneObjectStyle, getToothRegion } from "./general/utils";

interface ToothAnimationProps {
  scene: SceneObj[];
  animatedTeethVisible: boolean;
  activeToothId?: number;
  duration?: number;
}

function ToothAnimationComponent({
  scene,
  animatedTeethVisible,
  activeToothId,
  duration = 1.5,
}: ToothAnimationProps) {
  // Memoize filtered animated objects to prevent re-filtering on every render
  const animatedObjects = useMemo(
    () => scene.filter((o) => o.animated),
    [scene]
  );

  return (
    <Box>
      {animatedObjects.map((sceneObj) => {
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
              visibility:
                animatedTeethVisible && shouldAnimate ? "visible" : "hidden",
            }}
          />
        );
      })}
    </Box>
  );
}

export default memo(ToothAnimationComponent);
