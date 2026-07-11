import { Link } from "react-router-dom";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { useForms } from "../hooks/useForms";
import { formService } from "../services/formService";

export const FormsListPage = () => {
  const { forms, loading, error, refetch } = useForms();

  const handleDelete = async (formId: string) => {
    if (!window.confirm("Delete this form? This also deletes its submissions and events.")) return;
    await formService.remove(formId);
    void refetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Forms</h1>
        <Link className="btn btn-primary" to="/forms/new">
          + Create form
        </Link>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && !error && forms.length === 0 && (
        <p className="state-message">No forms yet. Create your first one.</p>
      )}

      {!loading && forms.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Version</th>
              <th>Fields</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {forms.map((form) => (
              <tr key={form.id}>
                <td>
                  <Link to={`/forms/${form.id}`}>{form.currentVersion.title}</Link>
                </td>
                <td>
                  <StatusBadge isPublished={form.isPublished} />
                </td>
                <td>v{form.currentVersion.versionNumber}</td>
                <td>{form.currentVersion.fields.length}</td>
                <td>{new Date(form.createdAt).toLocaleDateString()}</td>
                <td className="table-actions">
                  <Link className="btn btn-ghost" to={`/forms/${form.id}/versions`}>
                    History
                  </Link>
                  <Link className="btn btn-ghost" to={`/forms/${form.id}/submissions`}>
                    Submissions
                  </Link>
                  <Link className="btn btn-ghost" to={`/forms/${form.id}/analytics`}>
                    Analytics
                  </Link>
                  <button className="btn btn-danger" onClick={() => handleDelete(form.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
