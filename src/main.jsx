import React from "react";
import ReactDOM from "react-dom/client";
import LagGenerator from "./LagGenerator.jsx"; // Merk: stor L og filnavn må matche
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LagGenerator />
  </React.StrictMode>
);
