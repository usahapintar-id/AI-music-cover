import type { CoverProjectState } from "../types/cover";

interface ArrangementSheetProps {
  project: CoverProjectState;
  onUpdateLinerNotes: (notes: string) => void;
}

export function ArrangementSheet({
  project,
  onUpdateLinerNotes,
}: ArrangementSheetProps) {
  const { arrangement } = project;

  return (
    <section
      id="arrangement-section"
      className="rounded-lg border border-[#E4E4DF] bg-white p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#E4E4DF] pb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#121316]">
            Cover Arrangement Blueprint
          </h2>
          <p className="mt-1 text-sm text-[#5B5D64]">
            Production notes, vocal register direction, and section-by-section cues for{" "}
            <span className="font-medium text-[#121316]">{project.songTitle}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono-tabular text-xs text-[#43454C]">
          <span>{arrangement.targetBpm} BPM</span>
          <span aria-hidden="true">·</span>
          <span>{arrangement.musicalKey}</span>
          <span aria-hidden="true">·</span>
          <span>{arrangement.timeSignature}</span>
        </div>
      </div>

      {/* Vocal & Instrumentation Grid */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B5D64]">
              Vocal Direction
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#26282E]">
              {arrangement.vocalDirection}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B5D64]">
              Instrumentation Stack
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-[#26282E]">
              {arrangement.instrumentation.map((item, idx) => (
                <li
                  key={`${item}-${idx}`}
                  className="flex items-baseline gap-2.5 border-b border-[#F0F0EC] pb-1.5 last:border-none"
                >
                  <span className="font-mono-tabular text-xs text-[#8A8D95]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section Cues Table */}
        <div className="lg:col-span-7">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B5D64]">
            Section Cues
          </h3>
          <div className="mt-2 overflow-hidden rounded-md border border-[#E4E4DF]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E4E4DF] bg-[#F7F7F5] text-xs font-medium text-[#5B5D64]">
                <tr>
                  <th className="px-3.5 py-2.5">Section</th>
                  <th className="px-3.5 py-2.5 font-mono-tabular">Bars</th>
                  <th className="px-3.5 py-2.5">Production Cue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFEA]">
                {arrangement.sectionCues.map((cue, idx) => (
                  <tr key={`${cue.section}-${idx}`} className="hover:bg-[#FAFAF8]">
                    <td className="px-3.5 py-2.5 font-medium text-[#121316] whitespace-nowrap">
                      {cue.section}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono-tabular text-xs text-[#5B5D64] whitespace-nowrap">
                      {cue.bars}
                    </td>
                    <td className="px-3.5 py-2.5 text-[#34363D]">
                      {cue.productionNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Liner Notes */}
      <div className="mt-6 border-t border-[#E4E4DF] pt-5">
        <label
          htmlFor="liner-notes"
          className="block text-xs font-semibold uppercase tracking-wider text-[#5B5D64]"
        >
          Release Liner Notes
        </label>
        <textarea
          id="liner-notes"
          rows={2}
          value={project.linerNotes}
          onChange={(e) => onUpdateLinerNotes(e.target.value)}
          className="mt-2 w-full rounded-md border border-[#E4E4DF] bg-[#F7F7F5] px-3.5 py-2.5 text-sm leading-relaxed text-[#121316] focus:border-[#121316] focus:bg-white focus:outline-none"
        />
      </div>
    </section>
  );
}
