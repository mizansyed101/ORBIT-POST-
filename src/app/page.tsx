import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { 
  Rocket, 
  TrendingUp, 
  Bot, 
  Share2, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Seamlessly deliver authenticated users to their dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-obsidian text-cream flex flex-col font-sans overflow-x-hidden selection:bg-gold/30 selection:text-gold">
      
      {/* 
        ========================================================
        NAVBAR 
        ========================================================
      */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-obsidian/60 border-b border-cream/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gold to-yellow-200 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-obsidian" />
            </div>
            <span className="font-playfair font-bold text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cream to-cream/70">
              OrbitPost
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-cream/70">
            <Link href="#features" className="hover:text-gold transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-gold transition-colors">How it Works</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-medium text-cream/80 hover:text-cream transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-full bg-cream text-obsidian text-sm font-bold hover:bg-gold transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================
        HERO SECTION 
        ========================================================
      */}
      <main className="flex-1 flex flex-col pt-20">
        <section className="relative px-6 pt-32 pb-40 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Futuristic ambient glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream/5 border border-cream/10 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-cream/80 uppercase">
                AI Social Automation 2.0
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-playfair font-bold tracking-tight leading-[1.1] mb-8">
              Post faster. Grow smarter.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-amber-500">
                Rule your orbit.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-cream/60 max-w-2xl mb-10 leading-relaxed">
              OrbitPost uses cutting-edge AI to scan real-time trends in your niche, generating highly-tailored, SEO-optimized content that auto-posts across all your platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-gold to-amber-500 text-obsidian rounded-full font-bold text-lg transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative">Start Automating Free</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="#how-it-works" 
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-cream/20 text-cream font-medium text-lg hover:bg-cream/5 transition-colors"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* 
          ========================================================
          FEATURES GRID (BENTO BOX STYLE)
          ========================================================
        */}
        <section id="features" className="relative z-10 py-24 bg-obsidian border-t border-cream/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight mb-4">
                The Engine Behind the Magic
              </h2>
              <p className="text-cream/50 max-w-xl mx-auto text-lg">
                Stop staring at a blank page. OrbitPost wires together the best AI models to put your audience engagement on autopilot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <TrendingUp className="w-8 h-8 text-gold" />,
                  title: "12-Hour Trend Radar",
                  description: "We constantly scrape the latest news and trending searches in your niche so your posts are always highly relevant and timely."
                },
                {
                  icon: <Bot className="w-8 h-8 text-blue-400" />,
                  title: "Generative Personas",
                  description: "Our AI doesn't just write templates. It adopts your custom tone to generate wildly unique, SEO-optimized hooks."
                },
                {
                  icon: <Share2 className="w-8 h-8 text-purple-400" />,
                  title: "Composio Integration",
                  description: "Natively sync across Twitter, LinkedIn, Instagram, and more with unparalleled reliability through Composio APIs."
                },
                {
                  icon: <ShieldCheck className="w-8 h-8 text-green-400" />,
                  title: "Enterprise Grade Auth",
                  description: "We use Supabase combined with rigorous Row Level Security, ensuring your data and social keys are cryptographically locked."
                },
                {
                  icon: <Clock className="w-8 h-8 text-rose-400" />,
                  title: "Set & Forget Scheduling",
                  description: "Build an entire month's worth of campaigns in one click, and let our CRON workers dispatch them at the perfect times."
                },
                {
                  icon: <Rocket className="w-8 h-8 text-amber-500" />,
                  title: "Growth Analytics",
                  description: "Coming soon: Predict which posts will go viral before you even hit send using our upcoming analytics pipeline."
                }
              ].map((feat, i) => (
                <div 
                  key={i} 
                  className="group p-8 rounded-3xl bg-gradient-to-b from-cream/[0.03] to-transparent border border-cream/10 hover:border-gold/30 hover:bg-cream/[0.05] transition-all duration-500"
                >
                  <div className="mb-6 p-4 inline-block rounded-2xl bg-obsidian border border-cream/5 shadow-xl group-hover:scale-110 transition-transform duration-500">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-cream mb-3">{feat.title}</h3>
                  <p className="text-cream/50 leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 
          ========================================================
          HOW IT WORKS (STEPS)
          ========================================================
        */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-obsidian to-black border-t border-cream/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight mb-4">
                Three steps to escape gravity
              </h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 relative">
              {/* Connector line on desktop */}
              <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
              
              {[
                {
                  step: "01",
                  title: "Connect Platforms",
                  desc: "Link your favorite social channels in one unified dashboard securely."
                },
                {
                  step: "02",
                  title: "Set Your Niche",
                  desc: "Tell our AI what you care about. We lock onto those keywords and topics."
                },
                {
                  step: "03",
                  title: "Launch Campaigns",
                  desc: "Review daily AI-generated posts riding the latest trends, and let it post automatically."
                }
              ].map((item, i) => (
                <div key={i} className="flex-1 relative flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-obsidian border-2 border-cream/10 flex items-center justify-center mb-8 relative z-10 hover:border-gold/50 transition-colors shadow-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="text-4xl font-playfair font-bold text-cream/80 group-hover:text-gold transition-colors relative z-10">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-cream mb-3">{item.title}</h3>
                  <p className="text-cream/50 leading-relaxed max-w-[280px]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* 
          ========================================================
          BOTTOM CTA 
          ========================================================
        */}
        <section className="py-24 relative overflow-hidden flex justify-center text-center px-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-gold/10 via-obsidian to-obsidian" />
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-playfair font-bold mb-6">
              Ready to break the algorithm?
            </h2>
            <p className="text-xl text-cream/60 mb-10">
              Join the modern creators using AI to reclaim their time and exponentially scale their audience.
            </p>
            <Link 
              href="/login" 
              className="inline-flex px-10 py-5 bg-cream text-obsidian rounded-full font-bold text-xl hover:bg-gold hover:shadow-[0_0_40px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105"
            >
              Start using OrbitPost
            </Link>
          </div>
        </section>

      </main>

      {/* 
        ========================================================
        FOOTER 
        ========================================================
      */}
      <footer className="border-t border-cream/10 bg-black pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="font-playfair font-bold text-xl">OrbitPost</span>
          </div>
          <p className="text-cream/40 text-sm font-medium">
            © {new Date().getFullYear()} OrbitPost Technologies. Built for the future.
          </p>
        </div>
      </footer>
    </div>
  );
}
