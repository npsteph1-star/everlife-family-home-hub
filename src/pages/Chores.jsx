import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Chores() {
  const { state } = useContext(DataContext);
  const choreCount = state.chores ? state.chores.length : 0;
  return (
    <div className="card">
      <h2>Chores</h2>
      <p>You have {choreCount} chores.</p>
      <p>Create and assign chores to family members and track their completion.</p>
    </div>
  );
}
