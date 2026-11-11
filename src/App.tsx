import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfettiProvider } from "./components/ConfettiLayer";
import { PassportPage } from "./pages/PassportPage";
import { AdminPage } from "./pages/AdminPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ConfettiProvider>
          <Router>
            <Routes>
              <Route path="/" element={<PassportPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ConfettiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
