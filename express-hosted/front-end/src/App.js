import React, { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        Example
        {!data && <p>Loading...</p>}
        {data && <p>{data.data}</p>}
      </header>
    </div>
  );
}

export default App;
