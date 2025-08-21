import { Box, Card, Grid, Stack, Typography } from "@mui/material";
import TeethPlayer from "./TeethPlayer";
import { dummyStepsResponse } from "../api/dummy";
import { useEffect } from "react";
import { setJotai } from "../heplers/Jotai";
import {
  CompletedStepsAtom,
  CurrentSceneAtom,
  CurrentStepAtom,
  CurrentStepIndexAtom,
} from "../atoms/Tooth";
import { useAtomValue } from "jotai";

export default function TeethAnimations() {
  const currentStepIndex = useAtomValue(CurrentStepIndexAtom);
  const currentStep = dummyStepsResponse.steps[currentStepIndex];
  const completedSteps = useAtomValue(CompletedStepsAtom);

  useEffect(() => {
    setJotai(CurrentSceneAtom, dummyStepsResponse.status);
    setJotai(CurrentStepAtom, dummyStepsResponse.steps[0]);
  }, []);

  return (
    <Box
      maxWidth="100vw"
      minHeight="100dvh"
      sx={{
        background: "radial-gradient(circle, rgba(0,0,0,0), #d5e0ec)",
      }}
      px={3}
      overflow="hidden"
    >
      <Grid container spacing={3} alignItems="start" pt={1}>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <TeethPlayer data={dummyStepsResponse} autoPlay={false} />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <Box
            overflow="auto"
            sx={{ scrollbarWidth: "none", p: 1 }}
            maxHeight={550}
          >
            <Stack spacing={2}>
              {dummyStepsResponse.steps.map((step, index) => {
                const isActive = currentStep === step;
                const isCompleted = completedSteps.has(step.id);

                return (
                  <Stack
                    component={Card}
                    justifyContent="center"
                    variant="outlined"
                    sx={{
                      minHeight: 60,
                      maxWidth: "100%",
                      px: 2,
                      py: 1,
                      background: isCompleted
                        ? "linear-gradient(to left, rgba(44, 44, 44, 0), #879eb6ff)"
                        : "grey.100",
                      borderColor: isActive ? "primary.dark" : "grey.400",
                      borderWidth: isActive ? 2 : 1,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: 2,
                      },
                    }}
                    key={step.id}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={isActive ? "bold" : "normal"}
                    >
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Step {index + 1} - {step.type}
                    </Typography>
                    {/* {isCompleted && (
                      <Typography variant="caption" color="success.dark">
                        Completed
                      </Typography>
                    )} */}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
