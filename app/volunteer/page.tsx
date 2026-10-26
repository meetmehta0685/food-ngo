import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { UserCircle } from "@phosphor-icons/react/dist/ssr"

import { PageHeader } from "@/components/layout/page-header"
import { AvailabilityControl } from "@/components/volunteer/availability-control"
import {
  RescueOffers,
  type VolunteerAssignmentView,
} from "@/components/volunteer/rescue-offers"
import { authOptions } from "@/lib/auth/options"
import { db } from "@/lib/db"
import { listVolunteerAssignments } from "@/lib/rescue/service"

export default async function VolunteerDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) {
    redirect("/sign-up")
  }

  const assignments = await listVolunteerAssignments(session.user.id)
  const assignmentViews: VolunteerAssignmentView[] = assignments.map(
    (assignment) => {
      const offered = assignment.status === "OFFERED"

      return {
        id: assignment.id,
        status: assignment.status,
        distanceKm: assignment.distanceKm,
        offerExpiresAt: assignment.offerExpiresAt.toISOString(),
        foodType: assignment.donation.foodType,
        quantity: assignment.donation.quantity,
        estimatedWeightKg: assignment.donation.estimatedWeightKg,
        pickupAddress: offered ? null : assignment.donation.address,
        donorName: offered ? null : assignment.donation.donor.name,
        ngoName:
          assignment.donation.assignedNgo?.ngoProfile?.orgName ??
          assignment.donation.assignedNgo?.name ??
          "Assigned NGO",
        ngoAddress:
          offered
            ? null
            : assignment.donation.assignedNgo?.ngoProfile?.address ?? null,
        pickupLat: assignment.pickupLat,
        pickupLng: assignment.pickupLng,
        ngoLat: assignment.ngoLat,
        ngoLng: assignment.ngoLng,
        lastLat: assignment.lastLat,
        lastLng: assignment.lastLng,
      }
    },
  )

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Move the next handoff."
        description="Keep your availability and location current so time-sensitive rescue offers can find you."
        actions={<span className="text-muted-foreground inline-flex items-center gap-2 text-sm font-medium"><UserCircle className="text-primary size-5" />{session.user.name || "Volunteer"}</span>}
      />

      <AvailabilityControl initialProfile={{ isAvailable: profile.isAvailable, currentLat: profile.currentLat, currentLng: profile.currentLng, lastLocationAt: profile.lastLocationAt?.toISOString() ?? null }} />
      <RescueOffers assignments={assignmentViews} simulatorEnabled={process.env.NODE_ENV !== "production" && process.env.ENABLE_LOCATION_SIMULATOR === "true"} />
    </div>
  )
}
