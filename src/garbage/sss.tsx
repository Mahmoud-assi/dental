// import { useCallback, useEffect, useState } from "react";
// import Box from "@mui/material/Box";
// import type { SceneObj } from "./general/types";
// import { TOOTH_IDS, BASE_URL, TEETH_POSITIONS } from "./general/constants";
// import { useImagePreloader, useScale } from "./general/hooks";
// import { getAnimatedToothStyle, getSceneObjectStyle } from "./general/utils";
// import { CircularProgress } from "@mui/material";

// export default function TeethPlayer({
//   playerParams = { controls: true, language: "en" },
//   width = 500,
// }) {
//   const [scene, setScene] = useState<SceneObj[]>([]);
//   const { isLoaded, preloadAllImages } = useImagePreloader();
//   const scale = useScale(width, playerParams?.controls ?? true);
//   const [animatedTeethVisible, setAnimatedTeethVisible] = useState(false);

//   const getTeethPositions = useCallback(() => {
//     const positions: Record<number, { x: number; y: number; z: number }> = {};
//     Object.entries(TEETH_POSITIONS).forEach(([id, pos]) => {
//       positions[parseInt(id)] = { ...pos };
//     });
//     return positions;
//   }, []);

//   const buildScene = useCallback(() => {
//     const positions = getTeethPositions();

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
//       ...TOOTH_IDS.filter(
//         (id) => id !== 11 && id !== 21 && id !== 31 && id !== 24
//       ).map((id) => {
//         const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };

//         return {
//           src: `1/${id}`,
//           position: { x: pos.x, y: pos.y, z: pos.z },
//           unique_key: `tooth_${id}`,
//           tooth_id: id,
//         } as SceneObj;
//       }),
//       // Special animated teeth (11 and 21) - initially hidden and positioned
//       ...[11, 21, 31].map((id) => {
//         const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
//         return {
//           src: `15/${id}`,
//           position: { x: pos.x, y: pos.y, z: pos.z },
//           unique_key: `tooth_${id}_animated`,
//           tooth_id: id,
//           hidden: "1", // Initially hidden
//           animated: true, // Mark as animated tooth
//         } as SceneObj;
//       }),
//       // Filling
//       ...[24].map((id) => {
//         const pos = positions[id] ?? { x: 0, y: 0, z: 1000 };
//         return {
//           src: `3/${id}`,
//           position: { x: pos.x, y: pos.y, z: pos.z },
//           unique_key: `tooth_${id}_filling`,
//           tooth_id: id,
//         } as SceneObj;
//       }),
//     ];

//     setScene(base);
//     // Show animated teeth after a short delay
//     setTimeout(() => {
//       setAnimatedTeethVisible(true);
//     }, 1000);
//   }, [getTeethPositions]);

//   useEffect(() => {
//     preloadAllImages();
//   }, [preloadAllImages]);

//   useEffect(() => {
//     if (isLoaded) buildScene();
//   }, [isLoaded, buildScene]);

//   if (!isLoaded) {
//     return (
//       <Box
//         display="flex"
//         alignItems="center"
//         justifyContent="center"
//         height="100vh"
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   return (
//     <Box
//       sx={{
//         position: "relative",
//         transform: `scale(${scale})`,
//         willChange: "transform",
//         transformOrigin: "top center",
//         maxHeight: 1100,
//         maxWidth: width,
//         m: "0 auto",
//       }}
//     >
//       {/* Base jaw image */}
//       <Box
//         component="img"
//         id="scene_layer_base"
//         src={`${BASE_URL}base.png`}
//         style={{ position: "absolute", left: 0, top: 0, zIndex: 0 }}
//       />

//       {/* Teeth with Filling */}
//       {scene
//         .filter((o) => o.unique_key?.startsWith("tooth_"))
//         .map((sceneObj) => (
//           <Box
//             component="img"
//             key={sceneObj.unique_key}
//             id={`scene_layer_${sceneObj.unique_key}`}
//             src={`${BASE_URL}${sceneObj.src}.png`}
//             style={getSceneObjectStyle(sceneObj)}
//           />
//         ))}

//       {/* Animated teeth (11 and 21 and 31) */}
//       {scene
//         .filter((o) => o.animated)
//         .map((sceneObj) => (
//           <Box
//             component="img"
//             key={sceneObj.unique_key}
//             id={`scene_layer_${sceneObj.unique_key}`}
//             src={`${BASE_URL}${sceneObj.src}.png`}
//             style={getAnimatedToothStyle(sceneObj, animatedTeethVisible)}
//           />
//         ))}

//       {/* Base mask */}
//       <Box
//         component="img"
//         id="scene_layer_base_mask"
//         src={`${BASE_URL}base-mask.png`}
//         style={{ position: "absolute", left: 0, top: 0, zIndex: 9999 }}
//       />

//       {/* Tools */}
//       {scene
//         .filter((o) => !o.unique_key?.startsWith("tooth_"))
//         .map((sceneObj) => (
//           <Box
//             component="img"
//             key={sceneObj.unique_key}
//             id={`scene_layer_${sceneObj.unique_key}`}
//             src={`${BASE_URL}${sceneObj.src}.png`}
//             style={getSceneObjectStyle(sceneObj)}
//           />
//         ))}
//     </Box>
//   );
// }
