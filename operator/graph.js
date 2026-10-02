import { StateGraph, START, END } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { State } from "./state.js";
import { parseGoal } from "./nodes/parseGoal.js";
import { parseResume } from "./nodes/parseResume.js";
import { findJobs } from "./nodes/findJobs.js";
import { selectJobs, pickNextJob } from "./nodes/pickNextJob.js";
import { askApproval } from "./nodes/askApproval.js";
import { applyToJob } from "./nodes/applyToJob.js";
import { recover } from "./nodes/recover.js";
import { verify } from "./nodes/verify.js";
import { finalReport } from "./nodes/finalReport.js";

// Saved to disk, so a crashed run can be continued after a restart
const checkpointer = SqliteSaver.fromConnString("checkpoints.db");

async function parseInputs(state) {
  const [goal, candidate] = await Promise.all([parseGoal(state.goalText), parseResume(state.resumePath)]);
  return { goal, candidate };
}

// Next job if the queue has one, otherwise verify
const more = (state) => (state.queue.length ? "pickNextJob" : "verify");

export const app = new StateGraph(State)
  .addNode("parseInputs", parseInputs)
  .addNode("findJobs", findJobs)
  .addNode("selectJobs", selectJobs)
  .addNode("pickNextJob", pickNextJob)
  .addNode("askApproval", askApproval)
  .addNode("applyToJob", applyToJob)
  .addNode("recover", recover)
  .addNode("verify", verify)
  .addNode("finalReport", finalReport)
  .addEdge(START, "parseInputs")
  .addEdge("parseInputs", "findJobs")
  .addEdge("findJobs", "selectJobs")
  .addConditionalEdges("selectJobs", more)
  .addEdge("pickNextJob", "askApproval")
  .addConditionalEdges("askApproval", (s) => (s.approved ? "applyToJob" : more(s)))
  .addConditionalEdges("applyToJob", (s) => (s.outcome.status === "failed" ? "recover" : more(s)))
  .addConditionalEdges("recover", (s) => (s.outcome.status === "retry" ? "applyToJob" : more(s)))
  .addEdge("verify", "finalReport")
  .addEdge("finalReport", END)
  .compile({ checkpointer });