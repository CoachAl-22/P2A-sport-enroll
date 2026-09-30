import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Plus, BarChart3, ArrowLeft } from "lucide-react";
const coachAlistairImage = "/images/coach-photo.jpg";
const coachMiahImage = "/images/coach-miah.jpg";
const coachBlakeImage = "/images/coach-blake.jpg";
const coachGeorgiaImage = "/images/coach-georgia.jpg";
const coachGeenaImage = "/images/coach-geena.webp";
const coachDeclynImage = "/images/coach-declyn.webp";

export default function Coaches() {
  return (
    <div className="font-sans bg-black min-h-screen">
      {/* Navigation Bar */}
      <nav className="bg-black border-b border-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <a className="text-2xl font-heading font-bold text-orange-500">Power2ADAPT</a>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className="text-gray-300 hover:text-white hover:bg-gray-900 inline-flex items-center px-4 py-2 rounded-md transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Our Coaches</h1>
          <p className="text-xl md:text-2xl">Experienced professionals dedicated to athletic development</p>
        </div>
      </section>

      {/* Coaching Values */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-orange-500/50">
                <Users className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white mb-2">Qualified Expertise</h3>
              <p className="text-gray-300">Our coaching team holds recognized qualifications in sports science, athletics, and youth development</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-blue-500/50">
                <BarChart3 className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white mb-2">Proven Track Record</h3>
              <p className="text-gray-300">Years of experience developing young athletes with state and national level achievements</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 ring-2 ring-green-500/50">
                <Plus className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white mb-2">Individualized Approach</h3>
              <p className="text-gray-300">Every athlete receives personalized coaching tailored to their specific needs and goals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coach Profiles */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-orange-500 mb-8">Meet Our Coaching Team</h2>
            
            <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
              <p className="text-lg text-gray-300 leading-relaxed">
                All Power2Adapt Coaches are fully qualified athletics coaches, insured and WWC approved.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                They are passionate about sport, teaching movement and supporting an active and healthy lifestyle.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Our coaches are carefully matched to specific athletic development programs, based on their area of interest and expertise.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                Our university degree qualified coaches work together to develop world leading, long term development programs, based on the latest scientific research and continually implement new learning strategies for children and adult athletes.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Coach 1 - Alistair (Head Coach) */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-alistair">
              <div className="text-center mb-4">
                <img 
                  src={coachAlistairImage} 
                  alt="Alistair - Head Coach" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  data-testid="img-coach-alistair"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400" data-testid="text-coach-name-alistair">Alistair</h4>
                <p className="text-sm text-gray-100 font-medium" data-testid="text-coach-title-alistair">Head Coach</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Alistair started out in Little Aths, Cross Country and Fun runs and is a former National level track and field athlete (400mh) He has a Bachelor's Degree in Sports Coaching(PE) stream and has 20 years experience in coaching and is currently undertaking the Australian Athletics Level 4 High Performance coaching course.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                Coach Al has guided athletes to World Junior u20, National and State medals, as well as helping team sport athletes improve their agilty, speed and endurance to aid selection for academy and representative teams.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                Alistair prides himself on being an athletic movement and performance mindset specialist and is passionate about unlocking your potential to move better, live better and perform better in everything you do!
              </p>
            </div>

            {/* Coach 2 - Declyn */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-declyn">
              <div className="text-center mb-4">
                <img
                  src={coachDeclynImage}
                  alt="Declyn Tanner running on a track"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  loading="lazy"
                  data-testid="img-coach-declyn"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400">Declyn Tanner</h4>
                <p className="text-sm text-gray-100 font-medium">Junior Athletics Coach</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                I’m Declyn Tanner, a national-level 400m and 800m runner, Level 2 coach, and current Nutrition Science student at Deakin University.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                My journey with Power2ADAPT started when I was just nine years old. I was coached by Al for a couple of years before moving on to other coaches and continuing to develop as an athlete. It was during those early years with Power2ADAPT that I discovered my passion for athletics, particularly the 400m and 800m.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                At 16, I returned to Power2ADAPT—this time as a coach—and I’ve been coaching ever since. Having experienced the program first-hand as a young athlete, it’s incredibly rewarding to now help provide that same positive experience for the next generation.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                I coach our Prep–Grade 2 and Year 3–6 athletes, and what I enjoy most is watching young athletes build confidence, develop new skills and, most importantly, have fun while being active. I love finding ways to make training feel like a game while still teaching the fundamentals of running, movement and athletics.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                My own experience as a competitive athlete shapes the way I coach. It allows me to lead by example and gives me an understanding of the commitment, discipline and enjoyment that come with sport.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                As a coach, I want every child to feel encouraged to give things a go, learn new skills and enjoy the process. If they leave a session feeling more confident, having learnt something and looking forward to coming back, then we’re doing something right.
              </p>
            </div>

            {/* Coach - Geena Davy */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-geena">
              <div className="text-center mb-4">
                <img
                  src={coachGeenaImage}
                  alt="Geena Davy - Junior Jumps and Sprints Coach"
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  loading="lazy"
                  data-testid="img-coach-geena"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400">Geena Davy</h4>
                <p className="text-sm text-gray-100 font-medium">Junior Jumps and Sprints Coach</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                I'm Geena Davy, a specialist junior jumps and sprint coach, and a Level 2 coach currently studying Sports Development at Deakin University. I'm coached by Jason Hodson and was selected to represent Australia in the long jump at the 2026 World U20 Championships in Eugene, Oregon. This experience gave me an insight into future international competitions and how different athletes respond to different techniques, which also built my knowledge as a coach.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                I specialise in jumps and sprints, and I love building a relationship with my athletes and watching them build their skill set over time. As a coach, I bring strong enthusiasm to learning a new skill, which encourages the athletes and keeps them motivated within the sport.
              </p>
            </div>

            {/* Coach 3 - Georgia */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-georgia">
              <div className="text-center mb-4">
                <img 
                  src={coachGeorgiaImage} 
                  alt="Georgia - Junior Development Specialist" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  data-testid="img-coach-georgia"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400" data-testid="text-coach-name-georgia">Georgia</h4>
                <p className="text-sm text-gray-100 font-medium" data-testid="text-coach-title-georgia">Junior Development Specialist</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Georgia Middleton achieved early success in athletics, winning state championships in the 100m sprint. After graduating high school in 2019 she discovered a passion for coaching and inspiring the next generation of athletes. In 2022 she completed a Bachelor of Exercise and Sport Science, which deepened her understanding of the importance of physical activity and reinforced her belief that athletics is the foundation of all sports. Georgia's goal is to keep children active and help them develop a genuine love for sport. She creates a positive and engaging environment where young athletes can grow in confidence, develop their skills and enjoy every step of their journey.
              </p>
            </div>

            {/* Coach 4 - Blake */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-blake">
              <div className="text-center mb-4">
                <img 
                  src={coachBlakeImage} 
                  alt="Blake - Distance and Trail Running Specialist" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  data-testid="img-coach-blake"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400" data-testid="text-coach-name-blake">Blake</h4>
                <p className="text-sm text-gray-100 font-medium" data-testid="text-coach-title-blake">Distance and Trail Running Specialist</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                I've always loved pushing my physical limits to see what I'm truly capable of. For me, trail running is the perfect mix of freedom and challenge. It's not just about raw speed, but about resilience, adapting to obstacles, and embracing the unexpected challenges. Out on the trails you encounter experiences you never get in everyday life, and there is just a calmness to being in nature that's good for both mind and body.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                I want to coach to share my passion with others to help people build confidence, resilience, and consistency through endurance training, and to show them what they're truly capable of.
              </p>
            </div>

            {/* Coach 5 - Miah Noble */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-miah">
              <div className="text-center mb-4">
                <img 
                  src={coachMiahImage} 
                  alt="Miah Noble - Trail Running Specialist" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  data-testid="img-coach-miah"
                />
                <h4 className="text-xl font-heading font-bold text-cyan-400" data-testid="text-coach-name-miah">Miah Noble</h4>
                <p className="text-sm text-gray-100 font-medium" data-testid="text-coach-title-miah">Trail Running Specialist</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                As a coach, my mission is to support athletes of all levels, whether you are new to running or pursuing your next big goal through smart and sustainable training. I understand the challenge of balancing over 20 hours of training with a full-time job and the everyday demands of life.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                My approach emphasizes performance and well-being, ensuring you can run long-term, remain injury-free, and enjoy the process.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                I am dedicated to helping others cultivate strength, confidence, and resilience through running. If you're ready to run stronger, fuel better, and build genuine resilience, I'm here to guide you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8">Join our programs and start your athletic journey today</p>
          <Link href="/">
            <Button 
              size="lg"
              className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-heading font-semibold text-lg"
              data-testid="button-explore-programs"
            >
              Explore Programs
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
