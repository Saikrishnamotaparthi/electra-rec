import { useEffect, useState } from 'react';
import { subscribeAdminEmails } from '@/services/adminConfigService';

/** Live admin email list (seed + Firestore runtime admins). */
export function useAdminEmails(): { emails: string[]; loading: boolean } {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAdminEmails((list) => {
      setEmails(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { emails, loading };
}
