export default function AdminBulkCoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0A0A0A]">Bulk Course Management</h1>
        <p className="text-sm text-[#666460]">
          Upload a CSV file to import or update multiple courses at once.
        </p>
      </div>

      <div className="rounded-xl border border-[#DAD6CF] bg-white overflow-hidden shadow-sm">
        <div className="p-6">
          <p className="text-sm text-[#666460]">CSV Upload tool will go here.</p>
        </div>
      </div>
    </div>
  )
}
