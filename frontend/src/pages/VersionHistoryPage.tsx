import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { useForm } from "../hooks/useForm";
import { useFormVersions } from "../hooks/useFormVersions";
import { formService } from "../services/formService";

export const VersionHistoryPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { form, refetch: refetchForm } = useForm(formId);
  const { versions, loading, error, refetch } = useFormVersions(formId);

  if (!formId) return <ErrorState message="Form not found" />;

  const refreshAll = async () => {
    await Promise.all([refetch(), refetchForm()]);
  };

  const handlePublish = async (versionId: string) => {
    await formService.publish(formId, versionId);
    await refreshAll();
  };

  const handleRestore = async (versionId: string) => {
    if (!window.confirm("Restore this version? It will be copied into a new draft version.")) return;
    await formService.restoreVersion(formId, versionId);
    await refreshAll();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Version history{form ? ` — ${form.currentVersion.title}` : ""}</h1>
        <Link className="btn btn-ghost" to={`/forms/${formId}`}>
          Back to form
        </Link>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading &&
        versions.map((version) => {
          const isCurrent = form?.currentVersion.id === version.id;
          return (
            <div className="card version-card" key={version.id}>
              <div className="version-card-header">
                <strong>
                  v{version.versionNumber} — {version.title}
                </strong>
                <div className="version-card-badges">
                  {version.isPublished && <span className="status-badge status-published">Published</span>}
                  {isCurrent && <span className="status-badge status-draft">Current draft</span>}
                </div>
              </div>
              <p className="state-message">
                Created {new Date(version.createdAt).toLocaleString()}
                {version.publishedAt && ` · Published ${new Date(version.publishedAt).toLocaleString()}`}
              </p>
              <table className="table table-compact">
                <tbody>
                  {version.fields.map((field) => (
                    <tr key={field.id}>
                      <th>{field.label}</th>
                      <td>
                        {field.type}
                        {field.isRequired ? " (required)" : ""}
                        {field.correctOptions && field.correctOptions.length > 0 &&
                          ` · Correct: ${field.correctOptions.join(", ")}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-actions">
                {!version.isPublished && (
                  <button className="btn btn-secondary" onClick={() => handlePublish(version.id)}>
                    Publish this version
                  </button>
                )}
                {!isCurrent && (
                  <button className="btn btn-ghost" onClick={() => handleRestore(version.id)}>
                    Restore as new draft
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};
