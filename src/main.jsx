import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <div className="app">
      <h1>EverLife Family Home Hub</h1>
      <p>Your app is now deployed successfully.</p>

      <div className="card">
        <h2>Next Build Phase</h2>
        <ul>
          <li>Family Management</li>
          <li>Rewards</li>
          <li>Routines</li>
          <li>Calendar</li>
          <li>Meal Planning</li>
          <li>AI Assistant</li>
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
