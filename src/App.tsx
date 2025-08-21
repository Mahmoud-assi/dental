import { Provider } from "jotai";
import TeethAnimations from "./Teeth";
import { store } from "./heplers/Jotai";

const App = () => {
  return (
    <Provider store={store}>
      <TeethAnimations />
    </Provider>
  );
};

export default App;
