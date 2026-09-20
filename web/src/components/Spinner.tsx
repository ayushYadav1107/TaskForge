export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function FullPageSpinner() {
  return (
    <div className="full-page-loader">
      <div className="loader-mark">TF</div>
      <Spinner label="Loading TaskForge" />
    </div>
  );
}
