import { DateTime } from "luxon";
const defaultFormat = "YYYY-MM-DD";

export const date = {
    now: function (
        format: string = defaultFormat,
    ) {
        return DateTime.now().toFormat(format);
    },
    format: function (date: string, format: string = defaultFormat) {
        return DateTime.fromFormat(date, format);
    },
};
