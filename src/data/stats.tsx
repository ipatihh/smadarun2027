import { FaRunning, FaStar, FaRoute } from "react-icons/fa";
import { IStats } from "@/types";

export const stats: IStats[] = [
    {
        title: "1.000+",
        icon: <FaRunning size={34} className="text-primary-accent" />,
        description: "Pelari lintas komunitas & pelajar."
    },
    {
        title: "5.0",
        icon: <FaStar size={34} className="text-primary-accent" />,
        description: "Rating kepuasan peserta."
    },
    {
        title: "5K",
        icon: <FaRoute size={34} className="text-primary-accent" />,
        description: "Rute Fun Run steril & seru."
    }
];