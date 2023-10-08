import Runtime from "../../../bindings/bot-runtime";
import { isUserAdminOrBillingManager } from "../../../helpers";
import { Payload } from "../../../types";
import { taskInfo } from "../../wildcard";

export async function approveLabelChange() {
  const runtime = Runtime.getState();
  const { label } = runtime.adapters.supabase;
  const context = runtime.eventContext;
  const logger = runtime.logger;
  const payload = context.payload as Payload;
  const sender = payload.sender.login;

  logger.info(`Received '/authorize' command from user: ${sender}`);

  const { issue, repository } = payload;
  if (!issue) {
    return logger.info(`Skipping '/authorize' because of no issue instance`);
  }

  // check if sender is admin
  // passing in context so we don't have to make another request to get the user
  const userCan = await isUserAdminOrBillingManager(sender, context);

  // if sender is not admin, return
  if (userCan) {
    throw new Error(
      `User ${sender} is not an admin/billing_manager and do not have the required permissions to access this function.`
    );
  }

  const issueDetailed = taskInfo(issue);

  if (!issueDetailed.priceLabel || !issueDetailed.priorityLabel || !issueDetailed.timeLabel) {
    throw new Error(`No valid task label on this issue`);
  }

  // get current repository node id from payload and pass it to getLabelChanges function to get label changes
  const labelChanges = await label.getLabelChanges(repository.node_id);

  // Approve label changes
  labelChanges.forEach(async (labelChange) => {
    await label.approveLabelChange(labelChange.id);
    return logger.info(`Approved label change for ${labelChange.label_from} -> ${labelChange.label_to}`);
  });

  return `Label change has been approved, permit can now be generated`;
}
