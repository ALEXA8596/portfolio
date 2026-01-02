import Introduction from "@/components/Introduction";
import Timeline from "@/components/Timeline";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="w-full px-6 pt-24">
        <div className="max-w-4xl mx-auto">
          <Introduction />
        </div>
        
        <section className="py-16 w-full">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              My Resume
            </h2>
          </div>
          <Timeline />
        </section>
      </main>
      
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          © {new Date().getFullYear()} Portfolio. Built with Next.js.
        </div>
      </footer>
    </div>
  );
}
