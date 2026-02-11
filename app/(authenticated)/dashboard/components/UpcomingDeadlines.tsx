import { Card } from "@/components/ui/card"

export function UpcomingDeadlines() {
  // Hardcoded for now - future: pull from database
  const deadlines = [
    { date: "2026-03-15", title: "Round 1 Bidding Opens", type: "bidding" },
    { date: "2026-03-20", title: "Round 1 Bidding Closes", type: "bidding" },
    { date: "2026-04-01", title: "Registration Opens", type: "registration" },
    { date: "2026-04-10", title: "Last Day to Add Courses", type: "add_drop" },
    { date: "2026-05-15", title: "Final Exams Begin", type: "finals" },
  ]

  const today = new Date()
  const upcoming = deadlines
    .filter((d) => new Date(d.date) >= today)
    .slice(0, 5)

  return (
    <Card className="p-6 bg-card border border-border shadow-none rounded-none">
      <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-4">
        Upcoming Deadlines
      </h3>
      <div className="space-y-3">
        {upcoming.map((deadline) => (
          <div
            key={deadline.date}
            className="flex justify-between items-start"
          >
            <span className="text-sm text-foreground">{deadline.title}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(deadline.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
