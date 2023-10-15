import { removeAssignees } from "../../../helpers";
import Runtime from "../../../bindings/bot-runtime";
import { Payload } from "../../../types";
import { closePullRequestForAnIssue } from "../../assign/index";
import { IssueCommentCommand } from "../commands";

export async function unassign(body: string) {
  const runtime = Runtime.getState();
  const { payload: _payload } = runtime.eventContext;
  const logger = runtime.logger;
  if (body != IssueCommentCommand.STOP) {
    return logger.error("Skipping to unassign", { body });
  }

  const payload = _payload as Payload;
  logger.info("Running '/stop' command handler", { sender: payload.sender.login });
  const issue = (_payload as Payload).issue;
  if (!issue) {
    return logger.info(`Skipping '/stop' because of no issue instance`);
  }

  const issueNumber = issue.number;
  const assignees = payload.issue?.assignees ?? [];

  if (assignees.length == 0) {
    return logger.warn("No assignees found for issue", { issueNumber });
  }
  const shouldUnassign = payload.sender.login.toLowerCase() == assignees[0].login.toLowerCase();
  logger.debug("Unassigning sender", {
    sender: payload.sender.login.toLowerCase(),
    assignee: assignees[0].login.toLowerCase(),
    shouldUnassign,
  });

  if (shouldUnassign) {
    await closePullRequestForAnIssue();
    await removeAssignees(
      issueNumber,
      assignees.map((i) => i.login)
    );
    return logger.ok("You have been unassigned from the task", { issueNumber, user: payload.sender.login });
  }
  return logger.warn("You are not assigned to this task", { issueNumber, user: payload.sender.login });
}
