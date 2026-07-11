import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useForm } from "../hooks/useForm";
import { useSubmissions } from "../hooks/useSubmissions";
import { submissionService } from "../services/submissionService";

export const SubmissionsPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form } = useForm(formId);
  const { submissions, loading, error, refetch } = useSubmissions(formId);

  if (!formId) return <ErrorState message="Form not found" />;

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm("Delete this submission?")) return;
    await submissionService.remove(formId, submissionId);
    void refetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Submissions{form ? ` — ${form.currentVersion.title}` : ""}</h1>
        <Link className="btn btn-ghost" to={`/forms/${formId}`}>
          Back to form
        </Link>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && submissions.length === 0 && (
        <p className="state-message">No submissions yet.</p>
      )}

      {!loading &&
        submissions.map((submission) => (
          <div className="card submission-card" key={submission.id}>
            <div className="submission-meta">
              <span>{new Date(submission.submittedAt).toLocaleString()}</span>
              <button className="btn btn-danger" onClick={() => handleDelete(submission.id)}>
                Delete
              </button>
            </div>
            <table className="table table-compact">
              <tbody>
                {Object.entries(submission.data).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{Array.isArray(value) ? value.join(", ") : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};
