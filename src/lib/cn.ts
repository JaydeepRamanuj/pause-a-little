/** Join the class names that are set. */
export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');
