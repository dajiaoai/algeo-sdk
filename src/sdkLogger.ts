const SDK_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 36 36">
  <g clip-path="url(#a)">
    <path stroke="#A668B8" stroke-width="3.819" d="m30.261 29.85-5.368-23.9c-.163-.723-1.126-.875-1.503-.237l-9.082 15.349a.818.818 0 0 0 .288 1.12l14.45 8.551a.818.818 0 0 0 1.215-.884Z"/>
    <path stroke="#01B88B" stroke-width="3.819" d="M5.335 11.746V30.12c6.605.315 14.644.647 15.468-8.963.165-1.922-.34-4.035-.824-5.9-.851-3.276-3.854-5.913-12.59-5.913"/>
    <path fill="#A668B8" d="m16.483 13.62 2.182-3.682 3.273 1.91-3.682 6.137-1.773-4.364Z"/>
  </g>
  <defs>
    <clipPath id="a">
      <path fill="#fff" d="M0 0h36v36H0z"/>
    </clipPath>
  </defs>
</svg>`;

const BADGE_STYLE =
  'background-color: #f1faf7; background-position: 9px center;' +
  'background-repeat: no-repeat; background-size: 24px 24px;' +
  'border: 1px solid #9cd4c5; border-radius: 4px; padding: 6px 12px 6px 42px;' +
  'color: #123e35; font-size: 14px; font-weight: bold;';

const TITLE_STYLE =
  'background-color: #174e42; color: #fff; font-weight: bold; padding: 2px 8px;';
const DIVIDER = '+------------------------------------------------------+';

interface SdkNotice {
  title: string;
  lines: readonly string[];
}

export function logSdk(
  ...entry:
    | [kind: 'notice', notice: SdkNotice]
    | [kind: 'debug', message: string, ...details: unknown[]]
): void {
  if (entry[0] === 'debug') {
    const [, message, ...details] = entry;
    console.debug('[Algeo SDK]', message, ...details);
    return;
  }

  const [, { title, lines }] = entry;
  console.info(
    `%cALGEO SDK  /  大角几何%c\n\n${DIVIDER}\n|  %c%s%c\n%s\n${DIVIDER}`,
    `background-image: url(data:image/svg+xml;base64,${btoa(SDK_LOGO)});${BADGE_STYLE}`,
    '',
    TITLE_STYLE,
    title,
    '',
    ['|', ...lines.map((line) => (line ? `|  ${line}` : '|'))].join('\n'),
  );
}
