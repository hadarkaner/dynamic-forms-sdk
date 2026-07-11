import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useAnalyticsSummary } from "../hooks/useAnalyticsSummary";
import { useForm } from "../hooks/useForm";

export const AnalyticsPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form } = useForm(formId);
  const { summary, events, loading, error } = useAnalyticsSummary(formId);

  if (!formId) return <ErrorState message="Form not found" />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Analytics{form ? ` — ${form.currentVersion.title}` : ""}</h1>
        <Link className="btn btn-ghost" to={`/forms/${formId}`}>
          Back to form
        </Link>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && summary && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Views</span>
              <span className="stat-value">
                {summary.byType.find((entry) => entry.type === "VIEW")?.count ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Starts</span>
              <span className="stat-value">
                {summary.byType.find((entry) => entry.type === "START")?.count ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Submissions</span>
              <span className="stat-value">
                {summary.byType.find((entry) => entry.type === "SUBMIT")?.count ?? 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completion rate</span>
              <span className="stat-value">{(summary.completionRate * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Abandon rate</span>
              <span className="stat-value">{(summary.abandonRate * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Offline submissions</span>
              <span className="stat-value">{summary.offlineSubmissions}</span>
            </div>
          </div>

          <h2>Submissions by device</h2>
          {summary.byDevice.length === 0 && <p className="state-message">No submissions recorded yet.</p>}
          {summary.byDevice.length > 0 && (
            <div className="stat-grid">
              {summary.byDevice.map((entry) => (
                <div className="stat-card" key={entry.device}>
                  <span className="stat-label">{entry.device}</span>
                  <span className="stat-value">{entry.count}</span>
                </div>
              ))}
            </div>
          )}

          <h2>Recent events</h2>
          {events.length === 0 && <p className="state-message">No events recorded yet.</p>}
          {events.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Recorded at</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((event) => (
                  <tr key={event.id}>
                    <td>{event.type}</td>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                    <td>{event.metadata ? JSON.stringify(event.metadata) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};
