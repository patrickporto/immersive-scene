import { useToastStore } from '../stores/toastStore';

export function useToast() {
  const { toast, success, error } = useToastStore();
  return { toast, success, error };
}
