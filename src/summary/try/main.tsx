import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AIChatContextProvider, AtlasThemeProvider } from "@diligentcorp/atlas-react-bundle";
import "@diligentcorp/atlas-react-bundle/styles";
import TryPage from "./TryPage.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtlasThemeProvider tokenMode="atlas-light">
      <AIChatContextProvider>
        <TryPage />
      </AIChatContextProvider>
    </AtlasThemeProvider>
  </StrictMode>,
);
