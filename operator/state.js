import { Annotation } from "@langchain/langgraph";

// The shared notebook every node reads from and writes to
export const State = Annotation.Root({
  goalText: Annotation(),
  resumePath: Annotation(),
  goal: Annotation(),
  candidate: Annotation(),
  jobs: Annotation(),
  queue: Annotation(),    // jobs still to apply to
  current: Annotation(),  // the job being processed
  approved: Annotation(), // did the user approve the current job
  outcome: Annotation(),  // result of the latest apply attempt
  attempts: Annotation(), // attempts made for the current job
  results: Annotation({ reducer: (a, b) => a.concat(b), default: () => [] }), // appends
  verified: Annotation(),
  notice: Annotation(),   // result of the WhatsApp step
});