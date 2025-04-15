// src/components/ui/card.jsx
export function Card({ children }) {
  return <div className="border rounded shadow-md p-4 bg-white">{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
