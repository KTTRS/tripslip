import { Card, CardContent } from '@tripslip/ui'

const testimonials = [
  {
    quote: "TripSlip saved me hours of paperwork. Parents love how easy it is to sign and pay from their phones.",
    author: "Sarah Johnson",
    role: "5th Grade Teacher",
    school: "Lincoln Elementary"
  },
  {
    quote: "We've processed over 500 permission slips this year. The real-time tracking is a game changer.",
    author: "Michael Chen",
    role: "Principal",
    school: "Washington Middle School"
  },
  {
    quote: "As a parent, I appreciate getting the permission slip via text. No more lost papers in backpacks!",
    author: "Maria Rodriguez",
    role: "Parent",
    school: "Roosevelt High School"
  }
]

export default function Testimonials() {
  return (
    <section className="bg-white py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-black sm:text-5xl">
            Loved by teachers and parents
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See what our users have to say
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="border-2 border-black shadow-offset"
            >
              <CardContent className="pt-6">
                <p className="text-lg text-gray-700 mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-black">{testimonial.author}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-sm text-gray-500">{testimonial.school}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
