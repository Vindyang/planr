export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 pb-8 border-b border-border mb-8">
        <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Overview of system operations and user activity.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</h3>
            <p className="text-3xl font-normal tracking-tight text-foreground">--</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Courses</h3>
            <p className="text-3xl font-normal tracking-tight text-foreground">--</p>
          </div>
        </div>
      </div>
    </div>
  )
}
