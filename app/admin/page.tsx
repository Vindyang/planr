export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">Admin Dashboard</h1>
        <p className="text-sm text-[#666460]">
          Overview of system operations and user activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#DAD6CF] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-[#666460]">Total Users</h3>
            <p className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">--</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#DAD6CF] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-[#666460]">Active Courses</h3>
            <p className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">--</p>
          </div>
        </div>
      </div>
    </div>
  )
}
