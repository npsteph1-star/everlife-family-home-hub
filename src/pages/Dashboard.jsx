import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Dashboard() {
  const { state } = useContext(DataContext);
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <p>Welcome to your Family Home Hub. This overview shows today's priorities and recent activity.</p>
      <ul>
        <li>Family members: {state.members.length}</li>
        <li>Total chores: {state.chores.length}</li>
        <li>Total rewards: {state.rewards.length}</li>
        <li>Upcoming events: {state.calendar.length}</li>
      </ul>
      <p>Use the navigation bar to manage family members, chores, rewards, routines, and more.</p>
    </div>
  );
}
