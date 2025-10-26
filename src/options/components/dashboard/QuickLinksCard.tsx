import { DashboardCard } from "./DashboardCard";

export function QuickLinksCard() {
  return (
    <DashboardCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span>🔗</span>
        Groq Console
      </h3>
      <div className="space-y-2">
        <a
          href="https://console.groq.com/usage"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
        >
          <span className="text-sm font-medium">View Official Usage</span>
          <svg
            className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        <a
          href="https://console.groq.com/settings/limits"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
        >
          <span className="text-sm font-medium">Rate Limits & Quotas</span>
          <svg
            className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        <a
          href="https://groq.com/pricing/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
        >
          <span className="text-sm font-medium">Upgrade to Paid Tier</span>
          <svg
            className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </DashboardCard>
  );
}
