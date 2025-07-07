import { Button } from "@/components/ui/button";
import { BarChart, Zap, Shield, TrendingUp, ArrowRight, CheckCircle, UserCheck } from 'lucide-react';
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    title: "Smart Sales Flow",
    desc: "Fast barcode checkout, easy returns, and discounts built in."
  },
  {
    icon: <UserCheck className="h-6 w-6 text-blue-500" />,
    title: "Inventory Control",
    desc: "Track product quantities, categories, and stock alerts in real-time."
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-500" />,
    title: "Works Offline",
    desc: "No Wi-Fi? No problem. Record sales offline and sync later."
  },
];

const steps = [
  { title: "Set Up Your Store", desc: "Sign up to Techno Store System and set up your store from the dashboard." },
  { title: "Scan or Import Products", desc: "Add your products by scanning barcodes or importing your inventory data." },
  { title: "Start Selling in Minutes", desc: "Begin processing sales quickly with our intuitive POS system." },
];

const plans = [
  { name: "Basic", price: "19.99", period: "/month" },
  { name: "Pro", price: "39.99", period: "/month" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-gray-900">
      <main className="w-full">
        {/* Hero */}
        <section className="w-full pt-16 pb-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
            {/* Left: Text */}
            <div className="flex-1 space-y-6 md:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-left leading-tight">
                Modern POS and Inventory Software for Tech Stores
              </h1>
              <p className="text-lg md:text-xl max-w-lg text-gray-600 text-left">
                Techno Store System empowers tech shops to manage inventory, sell smarter, and grow faster.
              </p>
              <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-gray-100 hover:text-blue-600">
                <Link to="/dashboard">Get Started Now</Link>
              </Button>
              <div className="flex gap-6 pt-4">
                {/* No logos for now */}
              </div>
            </div>
            {/* Right: Hero Visual */}
            <div className="flex-1 flex justify-center md:justify-end w-full">
              <img
                src="/inventory-hero.jpg"
                alt="Warehouse staff adding new inventory entries on a tablet"
                className="w-full max-w-md h-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map(f => (
                <div key={f.title} className="bg-[#f8fafc] rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                  {f.icon}
                  <h3 className="font-semibold text-lg mt-4 mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us / Stats */}
        <section className="py-16 bg-[#f8fafc]">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-12">Why they prefer Techno Store System</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                <span className="text-4xl font-bold text-blue-600">100K+</span>
                <div className="text-gray-500 mt-2 text-sm">Transactions Processed</div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                <CheckCircle className="h-8 w-8 text-blue-500 mb-2" />
                <div className="font-semibold mb-1">Lightning-fast checkout</div>
                <div className="text-gray-500 text-sm">Zero data loss</div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
                <div className="font-semibold mb-1">Real-time dashboard insights</div>
                <div className="text-gray-500 text-sm">Reliable POS system performance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-12">Maximize your returns with a system that grows with you.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.title} className="bg-[#f8fafc] rounded-xl p-8 shadow-sm flex flex-col items-center text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{i + 1}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center mb-12">Choose your plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {plans.map(plan => (
                <div key={plan.name} className={`rounded-xl p-10 shadow-sm flex flex-col items-center text-center border ${plan.name === 'Pro' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200'}`}>
                  <div className="text-lg font-semibold mb-2">{plan.name}</div>
                  <div className="text-4xl font-bold mb-2">${plan.price}</div>
                  <div className="text-gray-400 mb-6">{plan.period}</div>
                  <Button className={plan.name === 'Pro' ? 'bg-white text-blue-600 hover:bg-blue-100' : 'bg-blue-600 text-white hover:bg-blue-700'}>
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-blue-900 text-white text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-4">
            <h2 className="text-2xl font-semibold">Start managing your store the smart way.</h2>
            <p className="text-blue-100 text-sm">Start using Techno Store System today—no setup fees, no training required.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-blue-100">
                <Link to="/dashboard">Get Started Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-800">
                <Link to="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 bg-[#f8fafc] border-t border-gray-100 mt-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-bold text-blue-900">
              <BarChart className="w-6 h-6 text-blue-600" /> Techno Store System
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <div>
                <div className="font-semibold text-gray-700 mb-1">Features</div>
                <div>Small Business</div>
                <div>Retailers</div>
                <div>Inventory</div>
                <div>Sales</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">Support</div>
                <div>About Us</div>
                <div>Careers</div>
                <div>Contact</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700 mb-1">Resources</div>
                <div>Blog</div>
                <div>Guides</div>
                <div>Templates</div>
              </div>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-blue-600 hover:text-blue-800"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.56v14.91c0 .97-.79 1.76-1.76 1.76H1.76A1.76 1.76 0 0 1 0 19.47V4.56C0 3.59.79 2.8 1.76 2.8h20.47C23.21 2.8 24 3.59 24 4.56zM7.19 19.47V9.24H3.56v10.23h3.63zm-1.81-11.6c1.16 0 2.1-.94 2.1-2.1 0-1.16-.94-2.1-2.1-2.1-1.16 0-2.1.94-2.1 2.1 0 1.16.94 2.1 2.1 2.1zm15.62 11.6v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3.63V9.24h3.48v1.39h.05c.48-.91 1.65-1.87 3.39-1.87 3.63 0 4.3 2.39 4.3 5.5v5.21h-3.63z"/></svg></a>
              <a href="#" className="text-blue-600 hover:text-blue-800"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.56v14.91c0 .97-.79 1.76-1.76 1.76H1.76A1.76 1.76 0 0 1 0 19.47V4.56C0 3.59.79 2.8 1.76 2.8h20.47C23.21 2.8 24 3.59 24 4.56zM7.19 19.47V9.24H3.56v10.23h3.63zm-1.81-11.6c1.16 0 2.1-.94 2.1-2.1 0-1.16-.94-2.1-2.1-2.1-1.16 0-2.1.94-2.1 2.1 0 1.16.94 2.1 2.1 2.1zm15.62 11.6v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3.63V9.24h3.48v1.39h.05c.48-.91 1.65-1.87 3.39-1.87 3.63 0 4.3 2.39 4.3 5.5v5.21h-3.63z"/></svg></a>
              <a href="#" className="text-blue-600 hover:text-blue-800"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.56v14.91c0 .97-.79 1.76-1.76 1.76H1.76A1.76 1.76 0 0 1 0 19.47V4.56C0 3.59.79 2.8 1.76 2.8h20.47C23.21 2.8 24 3.59 24 4.56zM7.19 19.47V9.24H3.56v10.23h3.63zm-1.81-11.6c1.16 0 2.1-.94 2.1-2.1 0-1.16-.94-2.1-2.1-2.1-1.16 0-2.1.94-2.1 2.1 0 1.16.94 2.1 2.1 2.1zm15.62 11.6v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3.63V9.24h3.48v1.39h.05c.48-.91 1.65-1.87 3.39-1.87 3.63 0 4.3 2.39 4.3 5.5v5.21h-3.63z"/></svg></a>
            </div>
          </div>
          <div className="text-center text-xs text-gray-400 mt-6">© Techno Store System 2024. All rights reserved.</div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;