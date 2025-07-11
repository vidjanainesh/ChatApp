export const formatRelativeTime = (date) => {
    const readDate = new Date(date);
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