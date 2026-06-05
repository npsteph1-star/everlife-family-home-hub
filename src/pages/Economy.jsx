import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Economy() {
  const { state } = useContext(DataContext);
  const { points, money, screenTime, tokens } = state.economy;
  return (
    <div className="card">
      <h2>Economy</h2>
      <p>Points: {points}</p>
      <p>Money: ${money}</p>
      <p>Screen Time: {screenTime} minutes</p>
      <p>Tokens: {tokens}</p>
      <p>Economy management will go here.</p>
    </div>
  );
}
