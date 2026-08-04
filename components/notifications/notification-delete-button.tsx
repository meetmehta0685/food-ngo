"use client"

import { SpinnerGap, Trash } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function NotificationDeleteButton({
  notificationId,
  notificationTitle,
}: {
  notificationId: string
  notificationTitle: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteNotification = async () => {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setError("Could not delete this notification. Please try again.")
        return
      }

      setOpen(false)
      window.dispatchEvent(new CustomEvent("notifications:refresh"))
      router.refresh()
    } catch {
      setError("Could not delete this notification. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen)
          setError(null)
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete notification: ${notificationTitle}`}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash weight="duotone" />
      </AlertDialogTrigger>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash weight="duotone" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete notification?</AlertDialogTitle>
          <AlertDialogDescription>
            This notification will be permanently removed from your activity log.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? <p className="text-destructive text-center text-xs">{error}</p> : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={deleteNotification}
          >
            {pending ? <><SpinnerGap data-icon="inline-start" className="animate-spin" />Deleting…</> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
