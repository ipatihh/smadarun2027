import { FaRunning, FaStar, FaRoute } from "react-icons/fa";
import { IStats } from "@/types";

export const stats: IStats[] = [
    {
        title: "1.000+",
        icon: <FaRunning size={34} className="text-primary-accent" />,
        description: "Pelari lintas komunitas, alumni, pelajar, dan umum siap memadati rute tahun ini."
    },
    {
        title: "5.0",
        icon: <FaStar size={34} className="text-primary-accent" />,
        description: "Rating kepuasan dari keseruan, kesterilan rute, dan kemeriahan event sebelumnya."
    },
    {
        title: "5K",
        icon: <FaRoute size={34} className="text-primary-accent" />,
        description: "Jalur Fun Run yang steril, penuh pemandangan seru, water station melimpah, dan cheering spot."
    }
];