import { useState } from "react";
import { RequestForm } from "../components/RequestForm";
import { SampleCard } from "../components/SampleCard";
import { StatTile } from "../components/StatTile";

interface HomePageProps {
  teamId: string;
  persona: string;
}

const STATS = [
  { label: "Open Tickets", value: "18", trend: "+3 this week" },
  { label: "Pending Reviews", value: "9", trend: "2 new today" },
  { label: "Avg Response Time", value: "1.2s", trend: "-0.3s vs last week" },
  { label: "Docs Indexed", value: "13", trend: "team: test" },
];

const JIRA_ROWS = [
  { primary: "FORGE-142", secondary: "Fix cross-tenant RAG leak", status: "In Progress" },
  { primary: "FORGE-138", secondary: "Add ServiceNow connector", status: "Backlog" },
  { primary: "FORGE-129", secondary: "Bedrock synth integration", status: "Blocked" },
];

const CONFLUENCE_ROWS = [
  { primary: "Deployment Runbook", secondary: "Platform space", status: "Updated 2d ago" },
  { primary: "On-call Rotation", secondary: "Platform space", status: "Updated 1w ago" },
  { primary: "SSO Setup Guide", secondary: "Security space", status: "Updated 3w ago" },
];

const SERVICENOW_ROWS = [
  { primary: "INC0012345", secondary: "VPN latency in APAC", status: "Resolved" },
  { primary: "INC0012399", secondary: "Password reset backlog", status: "In Progress" },
  { primary: "REQ0004821", secondary: "New laptop provisioning", status: "Pending Approval" },
];

const REPORTS_ROWS = [
  { primary: "Weekly Usage Report", secondary: "Generated Monday 9am", status: "Ready" },
  { primary: "Gate Pass Rate", secondary: "Last 30 days", status: "94%" },
  { primary: "Token Spend", secondary: "This month", status: "$412" },
];

export function HomePage({ teamId, persona }: HomePageProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);

  return (
    <div className="home-page">
      <div className="home-page__header">
        <h2>Overview</h2>
        <button type="button" onClick={() => setShowRequestForm((v) => !v)}>
          {showRequestForm ? "Close" : "+ New Request"}
        </button>
      </div>
      <div className="home-page__stats">
        {STATS.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>
      {showRequestForm && <RequestForm teamId={teamId} persona={persona} />}
      <div className="home-page__grid">
        <SampleCard icon="🎫" title="Jira" rows={JIRA_ROWS} />
        <SampleCard icon="📄" title="Confluence" rows={CONFLUENCE_ROWS} />
        <SampleCard icon="🛠️" title="ServiceNow" rows={SERVICENOW_ROWS} />
        <SampleCard icon="📊" title="Reports" rows={REPORTS_ROWS} />
      </div>
    </div>
  );
}
