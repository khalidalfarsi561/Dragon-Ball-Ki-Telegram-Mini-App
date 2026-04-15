import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import initializeDatabase from "./api/pocketbase";

async function bootstrap() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error("PocketBase initialization failed:", error);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
