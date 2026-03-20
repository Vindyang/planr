export default function AdminNotificationsPage() {
  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-none tracking-tight">
            System
            <br />
            <span className="italic text-muted-foreground">Notifications</span>
          </h1>
          <p className="max-w-xl text-sm uppercase tracking-widest text-foreground font-medium">
            Broadcast announcements to platform users
          </p>
        </div>
      </header>

      <div className="border border-border bg-card p-8 md:p-12">
        <h2 className="text-3xl font-serif text-foreground mb-4">Composer</h2>
        <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground font-medium">
          Notification creation and history will be available here soon.
        </p>
      </div>
    </div>
  )
}
