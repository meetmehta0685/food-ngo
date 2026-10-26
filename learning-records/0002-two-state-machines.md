# Two state machines

The user correctly distinguished the donation lifecycle from the rescue-assignment lifecycle: `EN_ROUTE_TO_NGO` belongs to an assignment, an expired offer leaves the donation `ACCEPTED` for another attempt, and a valid pickup OTP—not GPS alone—proves the food handoff. They demonstrated this by answering all three Lesson 2 quiz questions correctly.

**Evidence:** Answered Lesson 2 questions 1–3 correctly in sequence.

**Implications:** The user can now reason about aggregate state, attempt state, retryable terminal outcomes, and handoff guards. Next, teach authentication and authorization boundaries or trace volunteer dispatch and offer expiry in detail.
