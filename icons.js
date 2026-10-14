// Lucide Icons — https://lucide.dev
// Stroke-based (fill="none", stroke="currentColor"). All icons 24×24 viewBox rendered at 16px.

const ICONS = (() => {
  const s = (paths) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  return {
    // ── Navigation ────────────────────────────────────────────────────────────
    bars3: s(
      `<line x1="4" x2="20" y1="6"  y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>`,
    ),
    chevronLeft: s(`<path d="m15 18-6-6 6-6"/>`),
    chevronRight: s(`<path d="m9 18 6-6-6-6"/>`),
    chevronDown: s(`<path d="m6 9 6 6 6-6"/>`),
    xMark: s(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),

    // ── Actions ───────────────────────────────────────────────────────────────
    plus: s(`<path d="M5 12h14"/><path d="M12 5v14"/>`),
    check: s(`<path d="M20 6 9 17l-5-5"/>`),
    checkCircle: s(`<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`),
    circle: s(`<circle cx="12" cy="12" r="10"/>`),
    pencil: s(
      `<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>`,
    ),
    trash: s(
      `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
    ),
    // filled circles so dots are visible against fill="none" parent
    ellipsisVertical: s(
      `<circle cx="12" cy="5"  r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>`,
    ),
    clipboard: s(
      `<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>`,
    ),

    // ── Folders ───────────────────────────────────────────────────────────────
    folder: s(
      `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>`,
    ),
    folderPlus: s(
      `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/>`,
    ),
    // folder-minus — "remove from folder / uncategorized"
    folderArrowRight: s(
      `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="9" x2="15" y1="14" y2="14"/>`,
    ),

    // ── UI / Theme ────────────────────────────────────────────────────────────
    star: s(
      `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
    ),
    moon: s(`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`),
    sun: s(
      `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
    ),
    speakerWave: s(
      `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`,
    ),
    speakerXMark: s(
      `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/>`,
    ),
    arrowUp: s(
      `<line x1="12" x2="12" y1="19" y2="5"/><polyline points="5 12 12 5 19 12"/>`,
    ),
    arrowDown: s(
      `<line x1="12" x2="12" y1="5"  y2="19"/><polyline points="19 12 12 19 5 12"/>`,
    ),
    gitBranch: s(
      `<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>`,
    ),
    messageSquare: s(
      `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`,
    ),
    globe: s(
      `<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
    ),
    fileText: s(
      `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><line x1="10" x2="16" y1="13" y2="13"/><line x1="10" x2="14" y1="17" y2="17"/>`,
    ),
    bot: s(
      `<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>`,
    ),
    download: s(
      `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`,
    ),
    squareStop: s(
      `<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" stroke="none"/>`,
    ),

    // ── Input ─────────────────────────────────────────────────────────────────
    mic: s(
      `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>`,
    ),
    lightbulb: s(
      `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>`,
    ),
    paperclip: s(
      `<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>`,
    ),

    // ── Avatar ────────────────────────────────────────────────────────────────
    user: s(
      `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    ),
    cpu: s(
      `<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>`,
    ),
  };
})();
