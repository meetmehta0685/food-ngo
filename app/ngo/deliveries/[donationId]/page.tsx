import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { DeliveryConsole } from "@/components/ngo/delivery-console";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";
import { getRoleHomePath } from "@/lib/auth/roles";
import { expireRescueOffers } from "@/lib/rescue/service";

type PageProps = {
  params: Promise<{ donationId: string }>;
};

export default async function NgoDeliveryConsolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "NGO") {
    redirect(getRoleHomePath(session.user.role) ?? "/home");
  }

  const { donationId } = await params;

  await expireRescueOffers({ donationId });

  const donation = await db.donation.findUnique({
    where: { id: donationId },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedNgo: {
        select: {
          id: true,
          name: true,
          ngoProfile: {
            select: {
              lat: true,
              lng: true,
              orgName: true,
            },
          },
        },
      },
      statusEvents: {
        include: {
          actor: {
            select: {
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      rescueAssignments: {
        where: {
          status: {
            in: [
              "OFFERED",
              "ACCEPTED",
              "EN_ROUTE_TO_PICKUP",
              "ARRIVED_AT_PICKUP",
              "PICKED_UP",
              "EN_ROUTE_TO_NGO",
              "ARRIVED_AT_NGO",
            ],
          },
        },
        include: {
          volunteer: {
            select: {
              name: true,
              volunteerProfile: {
                select: {
                  phone: true,
                  vehicleType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!donation || donation.assignedNgoId !== session.user.id) {
    notFound();
  }

  const serializedDonation = {
    id: donation.id,
    status: donation.status,
    deliveryMode: donation.deliveryMode,
    address: donation.address,
    lat: donation.lat,
    lng: donation.lng,
    donor: {
      id: donation.donor.id,
      name: donation.donor.name,
    },
    assignedNgo: donation.assignedNgo
      ? {
          id: donation.assignedNgo.id,
          name: donation.assignedNgo.name,
          ngoProfile: donation.assignedNgo.ngoProfile
            ? {
                lat: donation.assignedNgo.ngoProfile.lat,
                lng: donation.assignedNgo.ngoProfile.lng,
                orgName: donation.assignedNgo.ngoProfile.orgName,
              }
            : null,
        }
      : null,
    statusEvents: donation.statusEvents.map((event) => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
      actor: {
        name: event.actor.name,
        role: event.actor.role,
      },
      lat: event.lat,
      lng: event.lng,
    })),
    rescueAssignment: donation.rescueAssignments[0]
      ? {
          id: donation.rescueAssignments[0].id,
          status: donation.rescueAssignments[0].status,
          volunteerName: donation.rescueAssignments[0].volunteer.name,
          volunteerPhone:
            donation.rescueAssignments[0].volunteer.volunteerProfile?.phone ??
            null,
          vehicleType:
            donation.rescueAssignments[0].volunteer.volunteerProfile
              ?.vehicleType ?? null,
          distanceKm: donation.rescueAssignments[0].distanceKm,
          offerExpiresAt:
            donation.rescueAssignments[0].offerExpiresAt.toISOString(),
          lastLat: donation.rescueAssignments[0].lastLat,
          lastLng: donation.rescueAssignments[0].lastLng,
          lastLocationAt:
            donation.rescueAssignments[0].lastLocationAt?.toISOString() ?? null,
        }
      : null,
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Delivery console"
        description="Update pickup progress and keep donor tracking synchronized."
      />
      <DeliveryConsole donation={serializedDonation} />
    </div>
  );
}
