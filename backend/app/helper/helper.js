export const toCamelCase = (obj) => {
    const camelCaseObj = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
        camelCaseObj[camelKey] = obj[key];
    }
    return camelCaseObj;
};