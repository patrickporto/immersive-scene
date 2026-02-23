import { motion } from 'framer-motion';

import { useGreet } from '../hooks/useGreet';

export function GreetForm() {
  const { name, greetMsg, isLoading, setName, greet } = useGreet();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await greet();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-4"
    >
      <form className="flex justify-center mb-4" onSubmit={handleSubmit}>
        <input
          id="greet-input"
          value={name}
          onChange={e => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          disabled={isLoading}
          className="mr-1 rounded-lg border border-transparent px-5 py-3 text-base font-medium text-[#0f0f0f] bg-white transition-all duration-250 shadow-[0_2px_2px_rgba(0,0,0,0.2)] outline-none dark:text-white dark:bg-[#0f0f0f98]"
        />
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg border border-transparent px-5 py-3 text-base font-medium text-[#0f0f0f] bg-white transition-all duration-250 shadow-[0_2px_2px_rgba(0,0,0,0.2)] outline-none cursor-pointer hover:border-[#396cd8] active:border-[#396cd8] active:bg-[#e8e8e8] disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:bg-[#0f0f0f98] dark:active:bg-[#0f0f0f69]"
        >
          {isLoading ? 'Loading...' : 'Greet'}
        </motion.button>
      </form>
      {greetMsg && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {greetMsg}
        </motion.p>
      )}
    </motion.div>
  );
}
