import { Card, CardContent } from '@tripslip/ui'

const testimonials = [
  {
    quote: "TripSlip saved me hours of paperwork. Parents love how easy it is to sign and pay from their phones.",
    author: "Sarah Johnson",
    role: "5th Grade Teacher",
    school: "Lincoln Elementary",
    avatar: "SJ",
    color: "bg-blue-100 text-blue-700"
  },
  {
    quote: "We've processed over 500 permission slips this year. The real-time tracking is a game changer.",
    author: "Michael Chen",
    role: "Principal",
    school: "Washington Middle School",
    avatar: "MC",
    color: "bg-green-100 text-green-700"
  },
  {
    quote: "As a parent, I appreciate getting the permission slip via text. No more lost papers in backpacks!",
    author: "Maria Rodriguez",
    role: "Parent",
    school: "Roosevelt High School",
    avatar: "MR",
    color: "bg-purple-100 text-purple-700"
  }
]

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 border-2 border-primary/50 rounded-full px-4 py-1.5 mb-4">
            <span className="text-sm font-semibold text-black">Testimonials</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-black sm:text-5xl">
            Loved by <span className="text-primary">teachers</span> and parents
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See what our pilot users have to say
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-2 border-black shadow-offset bg-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-offset-lg transition-all"
            >
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-primary fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center font-bold text-sm border-2 border-black`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-black">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role} — {testimonial.school}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
