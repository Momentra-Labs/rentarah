import SearchRounded from '@mui/icons-material/SearchRounded'

export type SearchBarProps = {
  locationLabel: string
  datesLabel: string
  /** One-line summary for narrow viewports (matches “Makati | Apr 30 – May 03”) */
  compactSummaryLine?: string
  onOpen: () => void
  modalOpen?: boolean
  showMidDot?: boolean
}

export default function SearchBar({
  locationLabel,
  datesLabel,
  compactSummaryLine,
  onOpen,
  modalOpen = false,
  showMidDot = false,
}: SearchBarProps) {
  const hasCompact = Boolean(compactSummaryLine)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-2 rounded-full border border-neutral-200/80 bg-white py-1.5 pl-3 pr-2 text-left shadow-search transition hover:shadow-md md:gap-3 md:py-2 md:pl-6"
      aria-haspopup="dialog"
      aria-expanded={modalOpen}
    >
      {hasCompact ? (
        <>
          <p className="min-w-0 flex-[1.35] truncate text-[13px] font-semibold leading-tight text-neutral-900 md:hidden">
            {compactSummaryLine}
          </p>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm font-semibold text-neutral-900 md:text-[15px]">{locationLabel}</p>
          </div>
          {showMidDot ? (
            <span className="hidden shrink-0 px-0.5 text-sm font-semibold text-neutral-300 sm:inline md:inline" aria-hidden>
              ·
            </span>
          ) : (
            <span className="hidden h-10 w-px shrink-0 bg-neutral-200 md:block" aria-hidden />
          )}
          <div className="hidden min-w-0 flex-1 md:flex md:flex-[1.1]">
            <p className="truncate text-sm text-neutral-600 md:text-[15px]">{datesLabel}</p>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-900 md:text-[15px]">{locationLabel}</p>
          </div>
          {showMidDot ? (
            <span className="hidden shrink-0 px-0.5 text-sm font-semibold text-neutral-300 sm:inline" aria-hidden>
              ·
            </span>
          ) : (
            <span className="hidden h-10 w-px shrink-0 bg-neutral-200 sm:block" aria-hidden />
          )}
          <div className="min-w-0 flex-1 sm:flex-[1.1]">
            <p className="truncate text-sm text-neutral-600 md:text-[15px]">{datesLabel}</p>
          </div>
        </>
      )}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A56DB] text-white shadow-sm transition-colors group-hover:bg-[#1748b8] md:h-11 md:w-11"
        aria-hidden
      >
        <SearchRounded sx={{ fontSize: 22 }} />
      </span>
    </button>
  )
}
