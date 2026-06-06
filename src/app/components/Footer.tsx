import { Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#3D3835] text-[#F5F1EC] py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl mb-6 text-[#D4C4B0]">VÖEL</h3>
            <p className="text-[#D4C4B0]/80 leading-relaxed">
              Moda feminina contemporânea para mulheres que valorizam elegância e qualidade.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-white">Comprar</h4>
            <ul className="space-y-2 text-[#D4C4B0]/80">
              <li><a href="#" className="hover:text-white transition-colors">Nova Coleção</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Vestidos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Conjuntos</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Favoritos</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white">Ajuda</h4>
            <ul className="space-y-2 text-[#D4C4B0]/80">
              <li><a href="#" className="hover:text-white transition-colors">Atendimento</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Rastreamento</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-white">Siga-nos</h4>
            <div className="flex gap-4">
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Instagram size={24} />
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Facebook size={24} />
              </a>
              <a href="#" className="hover:opacity-60 transition-opacity">
                <Twitter size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#8B7355]/30 pt-8 text-center text-[#D4C4B0]/80 text-sm">
          <p>&copy; 2026 VÖEL. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
