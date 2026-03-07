const showcaseItems = [
  {
    image: '/images/students-museum.png',
    label: 'Museum Adventures',
    color: 'from-blue-500/80 to-purple-500/80'
  },
  {
    image: '/images/science-lab.png',
    label: 'Science Experiments',
    color: 'from-green-500/80 to-teal-500/80'
  },
  {
    image: '/images/zoo-visit.png',
    label: 'Zoo Visits',
    color: 'from-orange-500/80 to-red-500/80'
  },
  {
    image: '/images/teacher-leading.png',
    label: 'Guided Learning',
    color: 'from-pink-500/80 to-rose-500/80'
  },
  {
    image: '/images/art-workshop.png',
    label: 'Art Workshops',
    color: 'from-violet-500/80 to-indigo-500/80'
  }
]

export default function PhotoShowcase() {
  return (
    <section className="bg-white py-24 px-6 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">Real Experiences</span>
          </div>
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Where <span className="text-primary">learning</span> comes alive
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            TripSlip connects students with hands-on educational experiences at museums, science centers, zoos, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {showcaseItems.map((item, index) => (
            <div
              key={item.label}
              className={`group relative rounded-2xl overflow-hidden border-3 border-black shadow-offset hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer ${
                index === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2' : 'aspect-square'
              }`}
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border-2 border-black inline-block">
                  <p className="text-sm font-bold text-black">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
