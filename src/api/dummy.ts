import { TOOTH_IDS } from "../Teeth/general/constants";
import type { StepsResponse } from "../Teeth/general/types";
import { getTeethPositions } from "../Teeth/general/utils";

export const dummyStepsResponse: StepsResponse = {
  steps: [
    {
      id: "step1",
      title: "Bridge",
      title_animation: "Fitting the bridge",
      toothId: 36,
      type: "bridge",
      tool: null,
      ordering: 1,
    },
    {
      id: "step2",
      title: "Temporary filling",
      title_animation: "Aesthetic filling",
      toothId: 16,
      type: "filling",
      tool: "drill",
      ordering: 2,
    },
    {
      id: "step3",
      title: "Temporary filling",
      title_animation: "Aesthetic filling",
      toothId: 21,
      type: "filling",
      tool: "drill",
      ordering: 3,
    },
    {
      id: "step4",
      title: "Bridge",
      title_animation: "Fitting the bridge",
      toothId: 46,
      type: "bridge",
      tool: null,
      ordering: 4,
    },
    {
      id: "step5",
      title: "Temporary filling",
      title_animation: "Aesthetic filling",
      toothId: 33,
      type: "filling",
      tool: "drill",
      ordering: 5,
    },
    {
      id: "step6",
      title: "Temporary filling",
      title_animation: "Aesthetic filling",
      toothId: 37,
      type: "filling",
      tool: "drill",
      ordering: 6,
    },
    {
      id: "step7",
      title: "Temporary filling",
      title_animation: "Aesthetic filling",
      toothId: 27,
      type: "filling",
      tool: "drill",
      ordering: 7,
    },
    {
      id: "step8",
      title: "Bridge",
      title_animation: "Fitting the bridge",
      toothId: 11,
      type: "bridge",
      tool: null,
      ordering: 8,
    },
  ],
  status: [
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
      (id) =>
        id !== 36 &&
        id !== 46 &&
        id !== 16 &&
        id !== 21 &&
        id !== 33 &&
        id !== 27 &&
        id !== 37 &&
        id !== 11
    ).map((id) => {
      const pos = getTeethPositions()[id] ?? { x: 0, y: 0, z: 1000 };
      return {
        src: `1/${id}`,
        position: { x: pos.x, y: pos.y, z: pos.z },
        unique_key: `tooth_${id}`,
        tooth_id: id,
      };
    }),
    ...[36, 46, 11].map((id) => {
      const pos = getTeethPositions()[id] ?? { x: 0, y: 0, z: 1000 };
      return {
        src: `15/${id}`,
        position: { x: pos.x, y: pos.y, z: pos.z },
        unique_key: `tooth_${id}_animated`,
        tooth_id: id,
        hidden: "1",
        animated: true,
      };
    }),
    ...[16, 21, 33, 27, 37].map((id) => {
      const pos = getTeethPositions()[id] ?? { x: 0, y: 0, z: 1000 };
      return {
        src: `3/${id}`,
        position: { x: pos.x, y: pos.y, z: pos.z },
        unique_key: `tooth_${id}_filling`,
        tooth_id: id,
      };
    }),
  ],
};
