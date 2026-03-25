"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type CreateSemesterDialogProps = {
  onCreate: (term: string, year: number) => Promise<void>
  defaultYear?: number
  defaultTerm?: string
}

export function CreateSemesterDialog({ 
  onCreate, 
  defaultYear = new Date().getFullYear(),
  defaultTerm = "Term 1",
  children
}: CreateSemesterDialogProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState(defaultTerm)
  const [year, setYear] = useState(defaultYear.toString())
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    try {
      setLoading(true)
      await onCreate(term, parseInt(year))
      toast.success("Semester plan created successfully")
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create semester", {
        description: (error as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>+ Add Semester</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Semester Plan</DialogTitle>
          <DialogDescription>
            Create a new semester plan to start adding courses.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="term" className="text-right">
              Term
            </Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1 (Aug-Jan)</SelectItem>
                <SelectItem value="Term 2">Term 2 (Jan-Apr)</SelectItem>
                <SelectItem value="Term 3">Term 3 (May-Aug)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Semester"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
