import { Provider } from "jotai";
import { store } from "./heplers/Jotai";
import { Box } from "@mui/material";
// import Jaw from "./Jaw";
import TeethAnimations from "./Teeth";

const App = () => {
  return (
    <Provider store={store}>
      <Box
        maxWidth="100vw"
        minHeight="100dvh"
        sx={{
          background: "radial-gradient(circle, rgba(0,0,0,0), #d5e0ec)",
        }}
        px={3}
        overflow="hidden"
      >
        {/* <Jaw /> */}
        <TeethAnimations />
      </Box>
    </Provider>
  );
};

export default App;
