import type { DonationStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusLabel } from "@/lib/donations/labels";

type DonorDonation = {
  id: string;
  foodType: string;
  quantity: string;
  servesCount: number;
  status: DonationStatus;
  pickupBy: string;
  assignedNgo: {
    name: string;
    ngoProfile: {
      orgName: string;
    } | null;
  } | null;
};

function statusVariant(
  status: DonationStatus,
): "default" | "secondary" | "outline" {
  if (status === "DELIVERED") return "default";
  if (
    status === "ACCEPTED" ||
    status === "PICKUP_IN_PROGRESS" ||
    status === "PICKED_UP"
  )
    return "outline";
  return "secondary";
}

export function DonorDonationsTable({
  donations,
}: {
  donations: DonorDonation[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/90 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              Food
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              Qty
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              Serves
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              Status
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              NGO
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest">
              Pickup by
            </TableHead>
            <TableHead className="font-mono text-[10px] uppercase tracking-widest text-right">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-muted-foreground text-center py-12 text-sm"
              >
                No donations reported yet. Start by reporting available food.
              </TableCell>
            </TableRow>
          ) : (
            donations.map((donation) => (
              <TableRow key={donation.id} className="border-border/30">
                <TableCell className="font-medium text-sm">
                  {donation.foodType}
                </TableCell>
                <TableCell className="text-sm">{donation.quantity}</TableCell>
                <TableCell className="text-sm">
                  {donation.servesCount}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(donation.status)}>
                    {statusLabel(donation.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {donation.assignedNgo?.ngoProfile?.orgName ??
                    donation.assignedNgo?.name ?? (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(donation.pickupBy).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/track/${donation.id}`}>
                    <Button variant="ghost" size="sm">
                      Track
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
