export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              System Notifications
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              Send announcements or targeted notifications to system users.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-none border border-border bg-card overflow-hidden shadow-none p-6">
        <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-medium">Notification composer and history will go here.</p>
      </div>
    </div>
  )
}
