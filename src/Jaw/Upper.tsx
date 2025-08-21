import { useCallback, useEffect, useState } from "react";
import type { SceneObj } from "../Teeth/general/types";
import { useImagePreloader } from "../Teeth/general/hooks";
import { Box } from "@mui/material";
import { BASE_URL, UPPER_TOOTH_IDS } from "../Teeth/general/constants";
import {
  getExtraSmallGumsPositions,
  getSceneObjectStyle,
  getTeethPositions,
} from "../Teeth/general/utils";

export default function UpperJaw({
  filteredTeeth = [],
  withGums = true,
}: {
  filteredTeeth?: number[];
  withGums?: boolean;
}) {
  const [scene, setScene] = useState<SceneObj[]>([]);
  const { isLoaded, preloadAllImages } = useImagePreloader();

  const buildScene = useCallback(() => {
    const toothpositions = getTeethPositions();
    const toothGumsPositions = getExtraSmallGumsPositions();
    const filteredIds = UPPER_TOOTH_IDS.filter(
      (id) => !filteredTeeth.includes(id)
    );

    const base: SceneObj[] = [
      ...filteredIds.map((id) => {
        const pos = toothpositions[id] ?? { x: 0, y: 0, z: 1000 };
        return {
          src: `300/${id}`,
          position: { x: pos.x, y: pos.y, z: pos.z },
          unique_key: `tooth_${id}`,
          tooth_id: id,
        } as SceneObj;
      }),
      ...(withGums
        ? filteredIds.map((id) => {
            const pos = toothGumsPositions[id] ?? { x: 0, y: 0, z: 1000 };
            return {
              src: `300/extra_small/${id}`,
              position: { x: pos.x, y: pos.y, z: pos.z },
              unique_key: `gums_${id}`,
              tooth_id: id,
              animated: true,
            } as SceneObj;
          })
        : []),
    ];
    setScene(base);
  }, [getTeethPositions, filteredTeeth, withGums]);

  useEffect(() => {
    preloadAllImages();
  }, [preloadAllImages]);

  useEffect(() => {
    if (isLoaded) buildScene();
  }, [isLoaded, buildScene]);

  return (
    <Box
      position="relative"
      sx={{
        transform: `scale(${300 / 700})`,
        maxHeight: "100%",
        width: "100%",
      }}
    >
      {scene.map((sceneObj) => (
        <Box
          component="img"
          key={sceneObj.unique_key}
          src={`${BASE_URL}${sceneObj.src}.png`}
          sx={getSceneObjectStyle(sceneObj)}
        />
      ))}
    </Box>
  );
}
