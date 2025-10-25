import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import RealtimeNotificationContainer from "./components/RealtimeNotification";
import Routes from "./Routes";

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Routes />
        <RealtimeNotificationContainer />
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
