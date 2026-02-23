import { useGreetStore } from '../stores/greetStore';

export function useGreet() {
  const { name, greetMsg, isLoading, setName, greet } = useGreetStore();

  return {
    name,
    greetMsg,
    isLoading,
    setName,
    greet,
  };
}
