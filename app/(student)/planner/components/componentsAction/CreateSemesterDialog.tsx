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
  disabled?: boolean
}

export function CreateSemesterDialog({ 
  onCreate, 
  defaultYear = new Date().getFullYear(),
  defaultTerm = "Term 1",
  disabled = false,
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
      toast.success("Term plan created successfully")
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to create term", {
        description: (error as Error).message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (disabled && nextOpen) return
      setOpen(nextOpen)
    }}>
      <DialogTrigger asChild>
        {children || <Button disabled={disabled}>+ Add Term</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Term Plan</DialogTitle>
          <DialogDescription>
            Create a new term plan to start adding courses.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="term" className="text-right">
              Term
            </Label>
            <Select value={term} onValueChange={setTerm} disabled={loading || disabled}>
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
              disabled={loading || disabled}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading || disabled}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || disabled}>
            {loading || disabled ? "Creating..." : "Create Term"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
