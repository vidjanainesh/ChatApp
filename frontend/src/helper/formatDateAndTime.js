export const formatRelativeTime = (date) => {
    if (!date) return "";

    const readDate = new Date(date);
    if (isNaN(readDate)) return ""; // guard invalid date

    const now = new Date();
    const diffMs = now - readDate;
    const diffMins = diffMs / (1000 * 60);
    const diffHours = diffMins / 60;

    if (diffMins < 1) {
        return "Just now";
    } else if (diffMins < 60) {
        return `${Math.floor(diffMins)} min${Math.floor(diffMins) > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${Math.floor(diffHours)} hour${Math.floor(diffHours) > 1 ? 's' : ''} ago`;
    } else if (diffHours < 48) {
        return "Yesterday";
    } else {
        return readDate.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }
};

export const formatDate = (ts) => {
    if (!ts) return "Today"; // 'Today' for temp messages

    const date = new Date(ts);
    if (isNaN(date)) return "Today"; // if ts is invalid

    const today = new Date();

    const isSameDay =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    if (isSameDay) return "Today";

    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }); // "Jun"
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

export const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

export function formatFullTimestamp(date) {
    return new Date(date).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}