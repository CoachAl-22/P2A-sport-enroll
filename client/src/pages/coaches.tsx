import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Plus, BarChart3, ArrowLeft } from "lucide-react";
import coachSamiImage from "@assets/IMG_3038_1759146359558.jpg";
import coachAlistairImage from "@assets/63271D0E-3E21-490C-B81E-18BEF5CCB270_1759298878111.jpg";
import coachMiahImage from "@assets/Miah Noble trail runner_1759299110875.jpg";
import coachBlakeImage from "@assets/IMG_1536_1759300077064.jpg";
import coachGeorgiaImage from "@assets/4F77B27D-B978-4B9A-982D-C5BD2350E00E_1759300730112.jpg";

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
                <h4 className="text-xl font-heading font-bold text-white" data-testid="text-coach-name-alistair">Alistair</h4>
                <p className="text-sm text-primary-400 font-medium" data-testid="text-coach-title-alistair">Head Coach</p>
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

            {/* Coach 2 - Sami */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-gray-600 transition-all" data-testid="coach-card-sami">
              <div className="text-center mb-4">
                <img 
                  src={coachSamiImage} 
                  alt="Sami - Running Specialist Coach" 
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-primary-400"
                  data-testid="img-coach-sami"
                />
                <h4 className="text-xl font-heading font-bold text-white" data-testid="text-coach-name-sami">Sami</h4>
                <p className="text-sm text-primary-400 font-medium" data-testid="text-coach-title-sami">Distance Running Specialist</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Sami's passion for running ignited during his soccer days when his natural speed and endurance shone through. 
                By 2020, running became his primary focus, and he has since dedicated himself to becoming stronger every day. As a competitive runner with four years of experience, Sami understands the challenges of starting a new sport, learning first-hand the risks of overtraining and the value of proper guidance.
              </p>
              <p className="text-gray-300 text-sm leading-relaxed mt-3">
                Through coaching education and personal experience, Sami has developed a tailored, holistic approach to help clients achieve their goals. Whether you aim to compete at a national level or build a foundation for another sport, Sami's expertise ensures you train efficiently and effectively. Backed by a network of experts and his team at Power2Adapt, Sami is dedicated to creating personalised, research-based programs to help you reach your full athletic potential.
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
                <h4 className="text-xl font-heading font-bold text-white" data-testid="text-coach-name-georgia">Georgia</h4>
                <p className="text-sm text-primary-400 font-medium" data-testid="text-coach-title-georgia">Junior Development Specialist</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                I aspire to continuing working with primary aged children to improve their fundamental running skills for not just athletics but for any sport they wish to improve in through their running!
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
                <h4 className="text-xl font-heading font-bold text-white" data-testid="text-coach-name-blake">Blake</h4>
                <p className="text-sm text-primary-400 font-medium" data-testid="text-coach-title-blake">Distance and Trail Running Specialist</p>
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
                <h4 className="text-xl font-heading font-bold text-white" data-testid="text-coach-name-miah">Miah Noble</h4>
                <p className="text-sm text-primary-400 font-medium" data-testid="text-coach-title-miah">Trail Running Specialist</p>
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
