import { useEffect } from "react";

function App() {

  useEffect(() => {
    console.log(import.meta.env.VITE_API_URL);

    fetch(`${import.meta.env.VITE_API_URL}/books`)
      .then(res => res.json())
      .then(data => console.log(data))
      .catch(err => console.log("FETCH ERROR:", err));
  }, []);

  return <h1>Test</h1>;
}

export default App;


