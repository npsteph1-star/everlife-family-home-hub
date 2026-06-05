import React from "react";

const items = [
  ["dashboard", "Dashboard"],
  ["family", "Family"],
  ["mom", "Mom Admin"],
  ["dad", "Dad Admin"],
  ["children", "Children"],
  ["chores", "Chores"],
  ["rewards", "Rewards"],
  ["screen", "Screen Time"],
  ["allowance", "Allowance"],
  ["routines", "Routines"],
  ["settings", "Settings"]
];

export default function Navigation({ active, setActive }) {
  return (
    <nav className="nav-tabs">
      {items.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={active === key ? "active" : ""}
          onClick={() => setActive(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
