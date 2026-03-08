const characters = [
  {
    image: '/images/char-blue-square.png',
    name: 'Buddy',
    role: 'The Planner',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    animation: 'animate-bounce-slow',
  },
  {
    image: '/images/char-purple-diamond.png',
    name: 'Gem',
    role: 'The Organizer',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    animation: 'animate-float',
  },
  {
    image: '/images/char-green-octagon.png',
    name: 'Scout',
    role: 'The Navigator',
    bg: 'bg-green-100',
    border: 'border-green-300',
    animation: 'animate-float-delayed',
  },
  {
    image: '/images/char-pink-heart.png',
    name: 'Sparkle',
    role: 'The Explorer',
    bg: 'bg-pink-100',
    border: 'border-pink-300',
    animation: 'animate-bounce-slow',
  },
  {
    image: '/images/char-yellow-star.png',
    name: 'Sunny',
    role: 'The Leader',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    animation: 'animate-float',
  },
  {
    image: '/images/char-red-pill.png',
    name: 'Dash',
    role: 'The Adventurer',
    bg: 'bg-red-100',
    border: 'border-red-300',
    animation: 'animate-float-delayed',
  },
];

export default function BrandCharacters() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl text-center">
        <h3 className="font-display text-2xl font-bold text-black sm:text-3xl mb-3">
          Meet the <span className="text-primary">TripSlip</span> Crew
        </h3>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-12">
          Our friendly crew is here to make every field trip an unforgettable experience.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {characters.map((char) => (
            <div
              key={char.name}
              className={`${char.bg} ${char.border} border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_#0A0A0A] hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`${char.animation} mb-3`}>
                <img
                  src={char.image}
                  alt={`${char.name} — ${char.role}`}
                  className="w-20 h-20 mx-auto object-contain drop-shadow-lg"
                />
              </div>
              <p className="font-bold text-[#0A0A0A] text-sm">{char.name}</p>
              <p className="text-xs text-gray-600">{char.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
