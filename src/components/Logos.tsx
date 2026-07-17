const Logos: React.FC = () => {
    return (
        <section id="logos" className="py-32 px-5 bg-background">
            <p className="text-lg font-medium text-center">
                Didukung oleh <span className="text-secondary">Sponsor & Partner Resmi</span>
            </p>
            <div className="mt-5 w-full flex flex-wrap flex-row items-center justify-evenly gap-5 sm:gap-10 opacity-60 logos-container">
                
                {/* Sponsor 1 */}
                <div className="w-28 sm:w-36 h-12 relative flex items-center justify-center">
                    <img 
                        src="/images/kembarin3.png" 
                        alt="Sponsor 1" 
                        className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
                    />
                </div>

                {/* Sponsor 2 */}
                <div className="w-28 sm:w-36 h-12 relative flex items-center justify-center">
                    <img 
                        src="/images/kembarin2.png" 
                        alt="Sponsor 2" 
                        className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
                    />
                </div>

                {/* Tambahkan pembungkus div di atas sebanyak jumlah sponsor kamu */}

            </div>
        </section>
    )
}

export default Logos