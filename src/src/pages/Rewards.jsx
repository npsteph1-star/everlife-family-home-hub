import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Rewards() {
  const { state } = useContext(DataContext);
  return (
    <div className="card">
      <h2>Rewards</h2>
      <p>Number of rewards: {state.rewards.length}</p>
      <p>Reward catalog and approval flow will go here.</p>
    </div>
  );
}
