import { StateGraph, START, END } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { State } from "./state.js";
import { parseGoal } from "./nodes/parseGoal.js";
import { parseResume } from "./nodes/parseResume.js";
import { findJobs } from "./nodes/findJobs.js";
import { selectJobs, pickNextJob } from "./nodes/pickNextJob.js";
import { applyToJob } from "./nodes/applyToJob.js";
import { verify } from "./nodes/verify.js";
import { finalReport } from "./nodes/finalReport.js";

async function parseInputs(state) {
  const [goal, candidate] = await Promise.all([parseGoal(state.goalText), parseResume(state.resumePath)]);//both of these are independent, so we can run them in parallel
  return { goal, candidate };
}

const more = (state) => (state.queue.length ? "pickNextJob" : "verify");

// Saved to disk, so a crashed run can be continued after restart
const checkpointer = SqliteSaver.fromConnString("checkpoints.db");

export const app = new StateGraph(State)
  .addNode("parseInputs", parseInputs)
  .addNode("findJobs", findJobs)
  .addNode("selectJobs", selectJobs)
  .addNode("pickNextJob", pickNextJob)
  .addNode("applyToJob", applyToJob)
  .addNode("verify", verify)
  .addNode("finalReport", finalReport)
  .addEdge(START, "parseInputs")
  .addEdge("parseInputs", "findJobs")
  .addEdge("findJobs", "selectJobs")
  .addConditionalEdges("selectJobs", more)
  .addEdge("pickNextJob", "applyToJob")
  .addConditionalEdges("applyToJob", more)
  .addEdge("verify", "finalReport")
  .addEdge("finalReport", END)
  .compile({ checkpointer});