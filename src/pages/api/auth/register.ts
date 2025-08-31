import { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  user_type: z.enum(['agent', 'fsbo', 'landlord', 'admin'])
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = userSchema.parse(req.body);
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
          user_type: body.user_type
        }
      }
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(201).json({ user: data.user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
