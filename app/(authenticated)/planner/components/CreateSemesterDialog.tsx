"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  defaultTerm = "Fall"
}: CreateSemesterDialogProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState(defaultTerm)
  const [year, setYear] = useState(defaultYear.toString())
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    try {
      setLoading(true)
      await onCreate(term, parseInt(year))
      setOpen(false)
    } catch (error) {
      console.error(error)
      // Ideally show error via toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          + Add Semester
        </Button>
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
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
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
