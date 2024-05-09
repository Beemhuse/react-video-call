import React from "react";
import { createRoot } from "react-dom/client";
import App from "./js/App";
import "./index.css";
import { WebRTCProvider } from "./js/WebRtcContext";

const root = createRoot(document.getElementById("root"));
root.render(
  <WebRTCProvider>
    <App />
  </WebRTCProvider>
);
