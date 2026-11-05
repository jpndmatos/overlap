# Overlap interface

A clock atlas: pale blue paper, rounded daylight tracks, blue meeting windows and tabular clock figures. Trebuchet MS provides the humanist UI type; monospaced local times keep changing digits stable.

At desktop widths, the timeline and meeting options sit side by side so the default three cities remain visible. At smaller widths, use a dedicated timeline/options switch. The chosen time, duration and calendar/copy actions must remain reachable without scrolling the whole desktop page.

Every city is an IANA zone, not a fixed UTC offset. Preserve the selected instant when changing, removing or resetting the reference city, rebasing to a valid interval where necessary. The date is interpreted in the current reference zone. Working hours, DST changes and weekend choices affect suggestions; unavailable times must be explained plainly.

Keep city settings beside each city. Use native controls, visible keyboard focus and the start-time select as a precise alternative to clicking the timeline. Saved options stay local to the browser. No portfolio chrome or decorative status badges.
