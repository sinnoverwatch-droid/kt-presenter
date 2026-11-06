import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
const Audience = React.lazy(() =>
  import("./components/Audience").then((module) => ({
    default: module.Audience,
  })),
);
const audienceId = new URLSearchParams(window.location.hash.slice(1)).get(
  "audience",
);
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<p role="status">Abriendo KT Presenter…</p>}>
      {audienceId ? <Audience id={audienceId} /> : <App />}
    </React.Suspense>
  </React.StrictMode>,
);
