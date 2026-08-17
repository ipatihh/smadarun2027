import { stats } from "@/data/stats"

const Stats: React.FC = () => {
    return (
        <section id="stats" className="py-10 lg:py-20">
            <div
                className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-b border-border"
            >
                {stats.map(stat => (
                    <div key={stat.title} className="text-center py-8 sm:py-4 sm:px-8 flex flex-col items-center">
                        <div className="mb-2">{stat.icon}</div>
                        <div className="font-display text-5xl sm:text-6xl font-bold text-foreground leading-none">
                            {stat.title}
                        </div>
                        <p className="mt-3 text-sm text-foreground-accent max-w-xs">{stat.description}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Stats
