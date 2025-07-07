import { Button } from "@/components/ui/button";
import { BarChart, ShoppingCart, Users, Zap, Shield, GitBranch } from 'lucide-react';
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 min-w-0">
      <main className="flex-1 min-w-0">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 md:px-8 text-center text-white">
          <div className="w-full text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                Techno Store System
              </h1>
              <p className="mx-auto text-gray-200 md:text-xl">
                A powerful Inventory Management and Point of Sale solution for modern retail.
              </p>
              <div className="space-x-4">
                <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-600">
                  <Link to="/dashboard">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-indigo-600 border-white hover:bg-white hover:text-indigo-600">
                  <Link to="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 px-4 md:px-8">
          <div className="w-full">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything you need to run your store
                </h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our platform is packed with features to help you manage your inventory, process sales, and grow your business.
                </p>
              </div>
            </div>
            <div className="grid w-full items-start gap-12 py-12 lg:grid-cols-3">
              <FeatureCard
                icon={<ShoppingCart className="h-8 w-8 text-indigo-500" />}
                title="Point of Sale"
                description="A fast and intuitive POS system that works on any device. Scan barcodes, accept payments, and manage orders with ease."
              />
              <FeatureCard
                icon={<GitBranch className="h-8 w-8 text-indigo-500" />}
                title="Inventory Management"
                description="Keep track of your stock levels in real-time. Add products, manage variations, and get low-stock alerts."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-indigo-500" />}
                title="Customer Management"
                description="Build lasting relationships with your customers. Keep track of their purchase history and contact information."
              />
              <FeatureCard
                icon={<BarChart className="h-8 w-8 text-indigo-500" />}
                title="Analytics & Reports"
                description="Get valuable insights into your business performance. Track sales, revenue, and best-selling products."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-indigo-500" />}
                title="Offline Mode"
                description="Never miss a sale. Our app works offline, and your data will automatically sync when you're back online."
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-indigo-500" />}
                title="Secure & Reliable"
                description="Your data is safe with us. We use industry-standard security measures to protect your information."
              />
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800 px-4 md:px-8">
          <div className="grid items-center justify-center gap-4 w-full text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to take your business to the next level?
              </h2>
              <p className="mx-auto text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Join hundreds of businesses who trust Techno Store System to manage their daily operations.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2 mx-auto">
              <Button asChild size="lg" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                <Link to="/dashboard">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-8 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Techno Store System. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link to="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link to="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
    return (
        <div className="grid gap-1">
            <div className="flex items-center gap-4">
                {icon}
                <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    )
}


export default LandingPage; 