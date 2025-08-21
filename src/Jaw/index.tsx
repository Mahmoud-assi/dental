import { Stack } from "@mui/material";
import UpperJaw from "./Upper";
import LowerJaw from "./Lower";
import type {
  LOWER_TOOTH_IDS,
  UPPER_TOOTH_IDS,
} from "../Teeth/general/constants";

export default function Jaw({
  filteredUpperTeeth = [],
  filteredLowerTeeth = [],
  upperWithGums = true,
  lowerWithGums = true,
}: {
  filteredUpperTeeth?: typeof UPPER_TOOTH_IDS;
  filteredLowerTeeth?: typeof LOWER_TOOTH_IDS;
  upperWithGums?: boolean;
  lowerWithGums?: boolean;
}) {
  return (
    <Stack
      spacing={2}
      height="calc(100dvh - 16px)"
      maxWidth="calc(100dvw - 16px)"
    >
      <UpperJaw filteredTeeth={filteredUpperTeeth} withGums={upperWithGums} />
      <LowerJaw filteredTeeth={filteredLowerTeeth} withGums={lowerWithGums} />
    </Stack>
  );
}
