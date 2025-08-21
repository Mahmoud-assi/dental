import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";
import { useImagePreloader } from "../Teeth/general/hooks";
import type { SceneObj } from "../Teeth/general/types";
import { getSceneObjectStyle, getTeethPositions } from "../Teeth/general/utils";
import { BASE_URL, TOOTH_IDS } from "../Teeth/general/constants";
import ToothAnimation from "../Teeth/ToothAnimation";
import ToolAnimation from "../Teeth/ToolAnimation";

export default function TeethPlayer({ width = 300 }: { width?: number }) {
  const [scene, setScene] = useState<SceneObj[]>([]);
  const { isLoaded, preloadAllImages } = useImagePreloader();

  const [showDrill, setShowDrill] = useState(true);
  const [toothState, setToothState] = useState<Record<number, boolean>>({
    48: false,
    14: false,
  });

  const handleDrillComplete = () => {
    setToothState((prev) => ({ ...prev, 14: true }));
    setShowDrill(false);
  };

  const buildScene = useCallback(() => {
    const positions = getTeethPositions();

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
      ...TOOTH_IDS.filter(
        (id) => id !== 11 && id !== 21 && id !== 31 && id !== 14
      ).map((id) => {
        const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
        return {
          src: `1/${id}`,
          position: { x: pos.x, y: pos.y, z: pos.z },
          unique_key: `tooth_${id}`,
          tooth_id: id,
        } as SceneObj;
      }),
      ...[11, 21, 31].map((id) => {
        const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
        return {
          src: `15/${id}`,
          position: { x: pos.x, y: pos.y, z: pos.z },
          unique_key: `tooth_${id}_animated`,
          tooth_id: id,
          hidden: "1",
          animated: true,
        } as SceneObj;
      }),
      ...[14].map((id) => {
        const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
        const isNormalTooth = toothState[id];

        return {
          src: isNormalTooth ? `1/${id}` : `3/${id}`,
          position: { x: pos.x, y: pos.y, z: pos.z },
          unique_key: `tooth_${id}_${isNormalTooth ? "normal" : "filling"}`,
          tooth_id: id,
        } as SceneObj;
      }),
    ];

    setScene(base);
  }, [getTeethPositions, toothState]);

  useEffect(() => {
    preloadAllImages();
  }, [preloadAllImages]);

  useEffect(() => {
    if (isLoaded) buildScene();
  }, [isLoaded, buildScene]);

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Container with fixed aspect ratio */}
      <Box
        sx={{
          position: "relative",
          width,
          height: 1100 * (width / 700),
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {/* Scaled content container */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 700,
            height: 1100,
            transform: `scale(${width / 700})`,
            transformOrigin: "top left",
          }}
        >
          {/* Base jaw image */}
          <Box
            component="img"
            id="scene_layer_base"
            src={`${BASE_URL}base.png`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* All teeth including the one that gets replaced */}
          {scene
            .filter((o) => o.unique_key?.startsWith("tooth_"))
            .map((sceneObj) => (
              <Box
                component="img"
                key={sceneObj.unique_key}
                id={`scene_layer_${sceneObj.unique_key}`}
                src={`${BASE_URL}${sceneObj.src}.png`}
                style={getSceneObjectStyle(sceneObj)}
              />
            ))}

          {/* Animated Teeth */}
          <ToothAnimation scene={scene} animatedTeethVisible={true} />

          {/* Title */}
          <Box
            sx={{
              position: "absolute",
              zIndex: 9999,
              top: 500,
              left: 0,
              right: 0,
              width: "100%",
            }}
          >
            <Typography
              textAlign="center"
              variant="subtitle1"
              sx={{ color: "primary.dark" }}
              fontSize={30}
            >
              Title here!
            </Typography>
          </Box>

          {/* Base mask */}
          <Box
            component="img"
            id="scene_layer_base_mask"
            src={`${BASE_URL}base-mask.png`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 9999,
              width: "100%",
              height: "100%",
            }}
          />

          {/* Tool with animation */}
          <ToolAnimation
            scene={scene}
            visible={showDrill}
            onAnimationComplete={handleDrillComplete}
            activeToothId={14}
          />
        </Box>
      </Box>
    </Box>
  );
}
