import Link from "next/link"
import { ArrowLeft, MapPin } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="gap-3">
          <Badge variant="outline" className="w-fit gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]">
            <MapPin data-icon="inline-start" /> Route not found
          </Badge>
          <CardTitle className="text-xl">That rescue route is no longer available.</CardTitle>
          <CardDescription>The link may be outdated, or you may not have access to this handoff.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/home" />} nativeButton={false}>
            <ArrowLeft data-icon="inline-start" />
            Return home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
