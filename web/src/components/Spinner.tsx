export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function FullPageSpinner() {
  return (
    <div className="page-loader">
      <span className="brand-mark" style={{ width: 32, height: 32, fontSize: 12 }}>
        TF
      </span>
      <Spinner label="Loading TaskForge" />
    </div>
  );
}
