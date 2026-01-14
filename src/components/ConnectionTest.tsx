import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ConnectionTest: React.FC = () => {
  const [status, setStatus] = useState('Checking connection...');

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        const { error } = await supabase.from('ideas').select('id').limit(1);

        if (error) {
          console.error(error);
          setStatus('❌ Supabase not reachable');
        } else {
          setStatus('✅ Connected');
        }
      } catch (err) {
        console.error(err);
        setStatus('❌ Connection failed');
      }
    };

    checkSupabase();
  }, []);

  return (
    <div className="fixed bottom-2 right-2 text-xs bg-black text-white px-3 py-1 rounded opacity-80">
      {status}
    </div>
  );
};

export default ConnectionTest;
