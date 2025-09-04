import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient();
  if (req.method === 'GET') {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = req.body;
      const { data: user, error } = await supabase
        .from('profiles')
        .insert([body])
        .select()
        .single();
      if (error) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
