export const StatusBadge = ({ isPublished }: { isPublished: boolean }) => (
  <span className={`status-badge ${isPublished ? "status-published" : "status-draft"}`}>
    {isPublished ? "Published" : "Draft"}
  </span>
);
