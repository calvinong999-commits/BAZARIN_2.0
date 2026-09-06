export function SponsorBanner() {
  return (
    <section className="border-t border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm py-14 mt-10">
      <div className="max-w-4xl mx-auto px-5">
        <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10">Didukung Oleh</p>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          
          {/* Crystalin Logo */}
          <div className="group flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-300">
            <div className="w-32 h-20 flex items-center justify-center p-2">
              <img 
                src="https://crystalinwater.com/wp-content/uploads/2019/12/logo-crystalin.png" 
                alt="Crystalin" 
                className="w-full h-full object-contain filter drop-shadow-md"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-text');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="fallback-text hidden font-black text-xl tracking-wide">
                <span className="text-cyan-500">crysta</span><span className="text-blue-600">lin</span>
              </div>
            </div>
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest text-center">Mountain Mineral Water</div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Good Day Logo */}
          <div className="group flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-300">
            <div className="w-32 h-20 flex items-center justify-center p-2">
              <img 
                src="https://santosjayaabadi.com/wp-content/uploads/2021/04/Good-Day-1.png" 
                alt="Good Day" 
                className="w-full h-full object-contain filter drop-shadow-md"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-text');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="fallback-text hidden font-black text-xl tracking-wide">
                <span className="text-amber-500">Good</span><span className="text-orange-600"> Day</span>
              </div>
            </div>
            <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest text-center">Instant Coffee</div>
          </div>

        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Terima kasih atas dukungan para sponsor dalam mewujudkan ekosistem UMKM yang lebih kuat 💙
        </p>
      </div>
    </section>
  )
}
