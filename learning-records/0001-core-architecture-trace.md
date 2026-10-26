# Core architecture trace

The user correctly identified that business rules belong in the domain service, that first-acceptance safety comes from a conditional database update, and that a durable event outbox makes realtime delivery recoverable. They demonstrated this by answering all three Lesson 1 quiz questions correctly, so future lessons can move beyond the basic request-to-database path and focus on the two state machines, authentication boundaries, and failure handling.

**Evidence:** Answered Lesson 1 questions 1–3 correctly in sequence.

**Implications:** Do not reteach the route/service/database/outbox mental model unless the user asks. Next, teach why donation status and rescue-assignment status are separate and trace one state transition through code.
