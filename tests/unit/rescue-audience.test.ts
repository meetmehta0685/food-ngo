import { describe, expect, it } from "vitest"

import {
  ngoProgressNotificationRecipients,
  volunteerTrackingRecipients,
} from "../../lib/rescue/audience"

describe("rescue audience privacy", () => {
  it("shares volunteer tracking only with the NGO and volunteer", () => {
    expect(
      volunteerTrackingRecipients({
        assignedNgoId: "ngo-1",
        volunteerId: "volunteer-1",
      }),
    ).toEqual(["ngo-1", "volunteer-1"])
  })

  it("keeps donor IDs out of progress notification audiences", () => {
    expect(ngoProgressNotificationRecipients("ngo-1")).toEqual(["ngo-1"])
    expect(ngoProgressNotificationRecipients(null)).toEqual([])
  })
})
