import { getSession } from "@/lib/auth"
import { getUserWithRole } from "@/lib/auth-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminProfilePage() {
  const session = await getSession()
  if (!session?.user) {
    return null
  }

  const user = await getUserWithRole(session.user.id)
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 pb-8 border-b border-border mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl leading-none font-normal uppercase tracking-tight text-foreground">
              Admin Profile
            </h1>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-2">
              View your admin account details and settings
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Account Information</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-6 pt-2">
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1">Name</p>
              <p className="text-lg font-serif italic">{user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1">Email</p>
              <p className="text-lg font-serif italic">{user.email}</p>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-2">Role</p>
              <span className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-wider font-medium border border-border bg-secondary text-secondary-foreground">
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1">Member Since</p>
              <p className="text-lg font-serif italic">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-none rounded-none p-6 h-fit">
          <CardHeader className="p-0 mb-6 border-b border-border pb-4">
            <CardTitle className="text-2xl font-serif italic text-foreground">Admin Permissions</CardTitle>
            <CardDescription className="text-xs uppercase tracking-wider font-medium text-muted-foreground mt-2">Your administrative capabilities</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4 pt-2">
            {user.role === "SUPER_ADMIN" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Full system access</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Create new admins</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Manage all users</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Manage courses</p>
                </div>
              </>
            )}
            {user.role === "ADMIN" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Manage users</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">Manage courses</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-muted-foreground" />
                  <p className="text-sm font-serif italic text-muted-foreground">Limited admin creation</p>
                </div>
              </>
            )}
            {user.role === "COORDINATOR" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">View users</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <p className="text-sm font-serif italic">View courses</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 bg-muted-foreground" />
                  <p className="text-sm font-serif italic text-muted-foreground">Limited modification rights</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
