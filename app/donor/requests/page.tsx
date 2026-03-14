import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";

import { DonorDonationsTable } from "@/components/donor/donations-table";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth/options";

export default async function DonorRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  if (session.user.role !== "DONOR") {
    redirect("/ngo/inbox");
  }

  const listDonations = () =>
    db.donation.findMany({
      where: { donorId: session.user.id },
      include: {
        assignedNgo: {
          select: {
            name: true,
            ngoProfile: {
              select: {
                orgName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

  let donations: Awaited<ReturnType<typeof listDonations>> = [];
  let loadError: string | null = null;

  try {
    const data = await Promise.race([
      listDonations(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("DONOR_REQUESTS_QUERY_TIMEOUT")),
          10_000,
        );
      }),
    ]);

    donations = data;
  } catch (error) {
    console.error("donor requests load error", error);
    loadError =
      "Could not load your donation history right now. You can still create a new request.";
  }

  const serializedDonations = donations.map((donation) => ({
    ...donation,
    pickupBy: donation.pickupBy.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-primary font-mono text-[10px] font-medium uppercase tracking-widest mb-1">
            Donor dashboard
          </p>
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">
            My donation requests
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track every request from report to delivery.
          </p>
        </div>
        <Link href="/donor/new">
          <Button className="h-10">
            <Plus className="mr-1.5 h-4 w-4" />
            New request
          </Button>
        </Link>
      </div>

      {loadError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      <DonorDonationsTable donations={serializedDonations} />
    </div>
  );
}
