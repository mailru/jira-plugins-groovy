export function extractShortClassName(className: string): string {
    if (className.indexOf('.') !== -1) {
        const tokens = className.split('.');
        return tokens[tokens.length-1];
    }
    return className;
}
