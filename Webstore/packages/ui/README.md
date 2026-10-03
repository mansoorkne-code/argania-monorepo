# Shared UI

`@repo/ui` contains app-agnostic accessible primitives and their shared visual
tokens. Import `@repo/ui/styles.css` once from each app's global stylesheet.

Available components:

- `Button` with primary, secondary, outline, ghost, and destructive variants.
- `Card` with header, title, description, content, and footer sections.
- `Input`, `Textarea`, and `Label` for form controls.
- `Badge`, `Separator`, and `Skeleton` for common interface details.
- `EmptyState` and `ErrorState` for data-driven screens.

Components accept native HTML attributes, support `className`, and contain no
application or database logic. Shared CSS variables use the `--ui-` prefix.
