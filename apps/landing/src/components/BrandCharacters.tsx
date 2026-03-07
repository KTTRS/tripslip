export default function BrandCharacters() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 px-6 overflow-hidden">
      <div className="mx-auto max-w-5xl text-center">
        <div className="relative inline-block mb-8">
          <img
            src="/images/brand-characters.png"
            alt="TripSlip brand characters — friendly school supplies ready for adventure"
            className="w-full max-w-3xl mx-auto animate-fade-in drop-shadow-2xl"
          />
        </div>
        <h3 className="text-2xl font-bold text-black sm:text-3xl">
          Meet the <span className="text-primary">TripSlip</span> crew
        </h3>
        <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">
          Our friendly crew is here to make every field trip an unforgettable experience.
        </p>
      </div>
    </section>
  )
}
