import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { setAuthApiBase } from "@workspace/replit-auth-web";

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
if (apiBase) {
  setBaseUrl(apiBase);
  setAuthApiBase(apiBase);
  setAuthTokenGetter(() => {
    try {
      return localStorage.getItem("lawnrx_cap_sid");
    } catch {
      return null;
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
