import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AtlasThemeProvider } from "@diligentcorp/atlas-react-bundle";
import "@diligentcorp/atlas-react-bundle/styles";
import DiscoveryPage from "./DiscoveryPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtlasThemeProvider tokenMode="atlas-light">
      <DiscoveryPage />
    </AtlasThemeProvider>
  </StrictMode>,
);
