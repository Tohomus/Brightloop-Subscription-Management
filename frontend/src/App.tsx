function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mb-4 inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          Frontend Setup Successful
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-white">
          Brightloop Subscription Management
        </h1>

        <p className="mb-6 leading-7 text-slate-400">
          Manage subscriptions, recurring billing, invoices, and payments
          through one unified platform.
        </p>

        <button
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-500"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;