import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  return (
    <section className="relative h-[500px] lg:h-[600px] overflow-hidden">
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1646526808599-078ce14639bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
        alt="Fashion Hero"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#3D3835]/10 to-[#3D3835]/40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h2 className="text-4xl lg:text-6xl mb-4 tracking-tight font-light">Nova Coleção</h2>
          <p className="text-lg lg:text-xl mb-8 max-w-2xl mx-auto text-white/95">
            Primavera/Verão 2026
          </p>
          <button className="bg-white text-[#3D3835] px-8 py-3 rounded-full hover:bg-[#F5F1EC] transition-all shadow-lg">
            Explorar Agora
          </button>
        </div>
      </div>
    </section>
  );
}
