import { baza } from './src/lib/baza'

/*
  Artykuł testowy: jeden szkic i jedna notka opublikowana. Para pozwala
  sprawdzić naraz oba wymagania — że opublikowana trafia wszędzie, a szkic
  nie trafia nigdzie.
*/
async function main() {
  const akcja = process.argv[2]

  if (akcja === 'usun') {
    const usuniete = await baza.wiadomosc.deleteMany({
      where: { slug: { startsWith: 'test-seo-' } },
    })
    console.log('usunieto artykuly testowe:', usuniete.count)
    await baza.$disconnect()
    return
  }

  await baza.wiadomosc.deleteMany({ where: { slug: { startsWith: 'test-seo-' } } })

  const opublikowana = await baza.wiadomosc.create({
    data: {
      slug: 'test-seo-opublikowana',
      tytul: 'Test SEO — notka opublikowana & sprawdzenie znaków',
      lid: 'Notka testowa sprawdzająca łańcuch publikacji. Zostanie usunięta.',
      tresc:
        'To jest artykuł testowy utworzony do sprawdzenia architektury SEO.\n\n' +
        'Drugi akapit istnieje po to, żeby dało się potwierdzić, że pełna treść ' +
        'jest obecna w pierwszej odpowiedzi HTML, bez wykonywania JavaScriptu.',
      zrodloNazwa: 'Test',
      zrodloAdres: 'https://example.com/test',
      stan: 'OPUBLIKOWANA',
      opublikowano: new Date(),
    },
    select: { slug: true },
  })

  const szkic = await baza.wiadomosc.create({
    data: {
      slug: 'test-seo-szkic',
      tytul: 'Test SEO — szkic, który nie może nigdzie trafić',
      lid: 'Szkic testowy. Nie powinien pojawić się w żadnym kanale.',
      tresc: 'Treść szkicu testowego.',
      stan: 'SZKIC',
    },
    select: { slug: true },
  })

  console.log('utworzono:', opublikowana.slug, '+', szkic.slug)
  await baza.$disconnect()
}
main()
