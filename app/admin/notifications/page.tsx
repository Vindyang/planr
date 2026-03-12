export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">System Notifications</h1>
        <p className="text-sm text-[#666460]">
          Send announcements or targeted notifications to system users.
        </p>
      </div>

      <div className="rounded-xl border border-[#DAD6CF] bg-white overflow-hidden shadow-sm">
        <div className="p-6">
          <p className="text-sm text-[#666460]">Notification composer and history will go here.</p>
        </div>
      </div>
    </div>
  )
}
