export default function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 pb-8 border-b border-border mb-8">
        <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">Admin Profile</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Manage your personal information and security settings.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Profile form will go here.</p>
        </div>
      </div>
    </div>
  )
}
