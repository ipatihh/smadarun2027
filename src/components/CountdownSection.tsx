import { FiMapPin } from "react-icons/fi";
import { getLiveEventData } from "@/lib/kembarinEvents";
import Countdown from "./Countdown";

async function CountdownSection() {
  const live = await getLiveEventData();

  return (
    <section id="countdown" className="px-5 -mt-2 mb-2">
      <div className="max-w-4xl mx-auto rounded-panel bg-secondary py-10 sm:py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-secondary-accent opacity-30 [clip-path:polygon(0_0,20%_0,8%_100%,0_100%)]"></div>
        <p className="relative text-center text-sm font-semibold uppercase tracking-wider text-primary mb-5">
          Hitung Mundur Hari Lomba
        </p>
        <div className="relative">
          <Countdown eventDate={live.eventDate} />
        </div>
        {live.location && (
          <div className="relative mt-6 flex items-center justify-center gap-2 text-sm text-on-secondary-muted">
            <FiMapPin className="w-4 h-4 text-primary shrink-0" />
            <span>{live.location}</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default CountdownSection;
