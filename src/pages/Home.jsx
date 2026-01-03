import Navbar from '../components/layout/Navbar'

function Home() {
  return (
    // Adicionamos flex e flex-col para garantir que as coisas apareçam
    <div className="min-h-screen bg-voel-beige flex flex-col">
      <Navbar />
      
      {/* O pt-24 (padding top) empurra o conteúdo para baixo da Navbar fixa */}
      <main className="pt-24 px-4 text-center">
        <h1 className="font-serif text-4xl text-voel-charcoal">
          VÖEL
        </h1>
        <p className="mt-4 text-gray-600">A página carregou com sucesso!</p>
      </main>
    </div>
  )
}

export default Home