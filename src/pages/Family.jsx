import React, { useContext } from 'react';
import { DataContext } from '../utils/DataContext.jsx';

export default function Family() {
  const { state } = useContext(DataContext);
  const memberCount = state.members ? state.members.length : 0;
  return (
    <div className="card">
      <h2>Family Management</h2>
      <p>You have {memberCount} family members.</p>
      <p>Use this page to add, edit, or remove family members and manage roles.</p>
    </div>
  );
}
