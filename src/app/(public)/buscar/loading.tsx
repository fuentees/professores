export default function BuscarLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse space-y-10 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-muted" />
        <div className="mx-auto h-9 w-2/3 rounded bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
      </div>
      <div className="space-y-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-4">
            <div className="h-10 w-56 rounded bg-muted" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((card) => <div key={card} className="h-64 rounded-2xl bg-muted" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
