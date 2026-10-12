import { isValid, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const CHECK_AFTER_UTC =
  /PostHog will be checked after \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC\.?/;

export function formatLocalTime(value: string) {
  const date = parseISO(value);
  if (!isValid(date)) return value;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(date, timeZone, "d MMM yyyy, h:mm a zzz");
}

export function localCheckDetail(detail: string, checkAfter: string | null) {
  if (!checkAfter || !CHECK_AFTER_UTC.test(detail)) return detail;
  return detail.replace(
    CHECK_AFTER_UTC,
    `PostHog will be checked after ${formatLocalTime(checkAfter)}.`,
  );
}
