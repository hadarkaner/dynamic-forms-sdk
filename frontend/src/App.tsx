import { Navigate, Route, Routes } from "react-router-dom";
import { ConnectionGate } from "./components/ConnectionGate";
import { Layout } from "./components/Layout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ApiKeysPage } from "./pages/ApiKeysPage";
import { CreateFormPage } from "./pages/CreateFormPage";
import { EditFormPage } from "./pages/EditFormPage";
import { FormsListPage } from "./pages/FormsListPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { VersionHistoryPage } from "./pages/VersionHistoryPage";

export const App = () => (
  <ConnectionGate>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<FormsListPage />} />
        <Route path="/forms/new" element={<CreateFormPage />} />
        <Route path="/forms/:formId" element={<EditFormPage />} />
        <Route path="/forms/:formId/versions" element={<VersionHistoryPage />} />
        <Route path="/forms/:formId/submissions" element={<SubmissionsPage />} />
        <Route path="/forms/:formId/analytics" element={<AnalyticsPage />} />
        <Route path="/api-keys" element={<ApiKeysPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </ConnectionGate>
);
