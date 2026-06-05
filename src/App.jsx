import React from "react";

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">EverLife Family Home Hub</p>
        <h1>Family Command Center</h1>
        <p>
          A mobile-first home hub for routines, chores, rewards, screen time,
          allowance, child profiles, and parent settings.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Dashboard</h2>
          <p>Today’s priorities, chores, routines, rewards, and reminders.</p>
        </div>

        <div className="card">
          <h2>Family Management</h2>
          <p>Add, edit, and manage parents, children, caregivers, and profiles.</p>
        </div>

        <div className="card">
          <h2>Mom Admin / Dad Admin</h2>
          <p>Two parent admins with equal access to approve rewards and manage settings.</p>
        </div>

        <div className="card">
          <h2>Chores</h2>
          <p>Assign chores, track completion, and connect tasks to rewards.</p>
        </div>

        <div className="card">
          <h2>Rewards</h2>
          <p>Screen-time bank, allowance bank, custom rewards, and parent approval.</p>
        </div>

        <div className="card">
          <h2>Routines</h2>
          <p>Morning, after-school, bedtime, toddler, and custom family routines.</p>
        </div>

        <div className="card">
          <h2>Settings</h2>
          <p>Manage family preferences, app configuration, and future AI settings.</p>
        </div>
      </section>
    </main>
  );
}
