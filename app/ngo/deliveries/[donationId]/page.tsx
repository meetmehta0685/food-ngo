import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DeliveryConsole } from "@/components/ngo/delivery-console";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

type PageProps = {
  params: Promise<{ donationId: string }>;
};

export default async function NgoDeliveryConsolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "NGO") {
    redirect("/donor/requests");
  }

  const { donationId } = await params;

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
    },
  });

  if (!donation || donation.assignedNgoId !== session.user.id) {
    notFound();
  }

  const serializedDonation = {
    id: donation.id,
    status: donation.status,
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
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">
          NGO operations
        </p>
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
          Delivery console
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update pickup progress and keep donor tracking synchronized.
        </p>
      </div>
      <DeliveryConsole donation={serializedDonation} />
    </div>
  );
}
