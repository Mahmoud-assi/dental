import { dummyStepsResponse } from "./api/dummy";
import TeethPlayer from "./Teeth/TeethPlayer";
import { Box, Card, Grid, Stack } from "@mui/material";

const App = () => {
  return (
    <Box
      maxWidth="100vw"
      minHeight="100dvh"
      sx={{ background: "radial-gradient(circle, rgba(0,0,0,0), #d5e0ec)" }}
      p={3}
      overflow="hidden"
    >
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <TeethPlayer data={dummyStepsResponse} autoPlay={false} />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <Box overflow="hidden">
            <Stack spacing={2}>
              {[1, 2].map((id) => (
                <Stack
                  component={Card}
                  justifyContent="center"
                  variant="outlined"
                  sx={{
                    minHeight: 40,
                    maxWidth: "100%",
                    px: 2,
                    py: 1,
                    bgcolor: "grey.100",
                    borderColor: "primary.dark",
                  }}
                  key={id}
                >
                  {id}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default App;
