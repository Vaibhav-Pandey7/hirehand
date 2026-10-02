import { Annotation } from "@langchain/langgraph";

// The shared notebook every node reads from and writes to
export const State = Annotation.Root({
  goalText: Annotation(),
  resumePath: Annotation(),
  goal: Annotation(),
  candidate: Annotation(),
  jobs: Annotation(),
  queue: Annotation(), // jobs still to apply to
  current: Annotation(), // the job being processed
  results: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }), // appends
  verified: Annotation(),
  outcome: Annotation(), // result of the latest apply attempt
  attempts: Annotation(), // attempts for the current job
  approved: Annotation(), // jobs that have been approved by the user
});
