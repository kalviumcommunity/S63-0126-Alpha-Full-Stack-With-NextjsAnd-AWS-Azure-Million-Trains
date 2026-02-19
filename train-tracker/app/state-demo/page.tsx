"use client";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";
import { useState } from "react";

export default function StateManagementDemo() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, notifications, addNotification } = useUI();
  const [username, setUsername] = useState("KalviumUser");

  const handleLogin = () => {
    login(username);
    addNotification(`Welcome back, ${username}!`, "success");
  };

  const handleLogout = () => {
    const currentUser = user;
    logout();
    addNotification(`Goodbye, ${currentUser}!`, "info");
  };

  // Theme-based styles
  const themeStyles = {
    background: theme === "dark" ? "#1a1a2e" : "#ffffff",
    color: theme === "dark" ? "#eee" : "#333",
    minHeight: "100vh",
    padding: "2rem",
    transition: "all 0.3s ease",
  };

  const cardStyles = {
    background: theme === "dark" ? "#16213e" : "#f8f9fa",
    padding: "1.5rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    border: theme === "dark" ? "1px solid #0f3460" : "1px solid #e0e0e0",
  };

  const buttonStyles = (color: string) => ({
    backgroundColor: color,
    color: "#fff",
    padding: "0.75rem 1.5rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "0.75rem",
    marginBottom: "0.5rem",
    transition: "transform 0.2s, box-shadow 0.2s",
  });

  const inputStyles = {
    padding: "0.75rem",
    borderRadius: "6px",
    border: theme === "dark" ? "1px solid #0f3460" : "1px solid #ccc",
    background: theme === "dark" ? "#16213e" : "#fff",
    color: theme === "dark" ? "#eee" : "#333",
    marginRight: "0.75rem",
    fontSize: "1rem",
    width: "200px",
  };

  const getNotificationStyles = (type: string) => {
    const baseStyles = {
      padding: "1rem",
      borderRadius: "6px",
      marginBottom: "0.75rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      animation: "slideIn 0.3s ease",
    };

    const colors = {
      info: { background: "#3498db", color: "#fff" },
      success: { background: "#2ecc71", color: "#fff" },
      warning: { background: "#f39c12", color: "#fff" },
      error: { background: "#e74c3c", color: "#fff" },
    };

    return { ...baseStyles, ...colors[type as keyof typeof colors] };
  };

  return (
    <div style={themeStyles}>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          button:active {
            transform: translateY(0);
          }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          🎯 State Management Demo
        </h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.8 }}>
          React Context API + Custom Hooks in action
        </p>
      </div>

      {/* Theme & Sidebar Controls */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🎨 UI Controls</h2>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            Current Theme: <strong>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</strong>
          </p>
          <p style={{ marginBottom: "1rem" }}>
            Sidebar Status: <strong>{sidebarOpen ? "📂 Open" : "📁 Closed"}</strong>
          </p>
        </div>
        <button onClick={toggleTheme} style={buttonStyles("#3498db")}>
          Toggle Theme
        </button>
        <button onClick={toggleSidebar} style={buttonStyles("#9b59b6")}>
          {sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        </button>
      </div>

      {/* Authentication Section */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔐 Authentication State</h2>
        {isAuthenticated ? (
          <div>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              ✅ Logged in as: <strong>{user}</strong>
            </p>
            <button onClick={handleLogout} style={buttonStyles("#e74c3c")}>
              Logout
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
              ❌ Not authenticated
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={inputStyles}
            />
            <button onClick={handleLogin} style={buttonStyles("#2ecc71")}>
              Login
            </button>
          </div>
        )}
      </div>

      {/* Notification Demo */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🔔 Notifications</h2>
        <p style={{ marginBottom: "1rem", opacity: 0.8 }}>
          Click a button to trigger a notification (auto-dismisses in 5s)
        </p>
        <button onClick={() => addNotification("This is an info message", "info")} style={buttonStyles("#3498db")}>
          Show Info
        </button>
        <button onClick={() => addNotification("Operation successful!", "success")} style={buttonStyles("#2ecc71")}>
          Show Success
        </button>
        <button onClick={() => addNotification("Warning: Check your input", "warning")} style={buttonStyles("#f39c12")}>
          Show Warning
        </button>
        <button onClick={() => addNotification("Error: Something went wrong", "error")} style={buttonStyles("#e74c3c")}>
          Show Error
        </button>
      </div>

      {/* Active Notifications Display */}
      {notifications.length > 0 && (
        <div style={{ position: "fixed", top: "20px", right: "20px", width: "350px", zIndex: 1000 }}>
          {notifications.map((notif) => (
            <div key={notif.id} style={getNotificationStyles(notif.type)}>
              <span>{notif.message}</span>
              <button
                onClick={() => useUI().removeNotification(notif.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  padding: 0,
                  marginLeft: "1rem",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar Simulation */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "250px",
            height: "100vh",
            background: theme === "dark" ? "#16213e" : "#f8f9fa",
            borderRight: theme === "dark" ? "1px solid #0f3460" : "1px solid #e0e0e0",
            padding: "2rem",
            boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
            animation: "slideInLeft 0.3s ease",
            zIndex: 999,
          }}
        >
          <style>
            {`
              @keyframes slideInLeft {
                from {
                  transform: translateX(-100%);
                }
                to {
                  transform: translateX(0);
                }
              }
            `}
          </style>
          <h3 style={{ marginBottom: "1.5rem" }}>📂 Sidebar Menu</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li style={{ marginBottom: "1rem", cursor: "pointer" }}>🏠 Home</li>
            <li style={{ marginBottom: "1rem", cursor: "pointer" }}>📊 Dashboard</li>
            <li style={{ marginBottom: "1rem", cursor: "pointer" }}>⚙️ Settings</li>
            <li style={{ marginBottom: "1rem", cursor: "pointer" }}>👤 Profile</li>
          </ul>
        </div>
      )}

      {/* Console Output Section */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>📟 Console Output</h2>
        <p style={{ opacity: 0.8 }}>
          Open your browser's developer console to see state change logs:
        </p>
        <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem", opacity: 0.9 }}>
          <li>✅ User logged in: [username]</li>
          <li>🔓 User logged out</li>
          <li>🎨 Theme toggled to: [theme]</li>
          <li>📱 Sidebar opened/closed</li>
          <li>🔔 Notification added: [type] [message]</li>
        </ul>
      </div>

      {/* Technical Details */}
      <div style={cardStyles}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>🛠️ Technical Implementation</h2>
        <div style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Contexts:</strong> AuthContext, UIContext
          </p>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Custom Hooks:</strong> useAuth(), useUI()
          </p>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>State Management:</strong> useState, useContext, localStorage, cookies
          </p>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Features:</strong> Theme persistence, auto-dismiss notifications, sidebar toggle
          </p>
        </div>
      </div>
    </div>
  );
}
