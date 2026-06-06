import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Rewards() {
  const { data } = useContext(DataContext);
  return (
    <div className="card">
      <h2>Rewards</h2>
      <p>Reward catalog and redemption requests.</p>
    </div>
  );
}
