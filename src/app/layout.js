import '../styles/globals.css';

export const metadata = {
  title: 'Expensa – Expense & Budget Tracker',
  description: 'Track your daily expenses and plan your budget',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
