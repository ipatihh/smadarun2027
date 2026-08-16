import { getLiveEventData } from "@/lib/kembarinEvents";
import DaftarForm from "./DaftarForm";

export default async function DaftarPage() {
  const live = await getLiveEventData();

  return <DaftarForm ticketTypes={live.ticketTypes} isOpen={live.isOpen} />;
}
