import { supabase } from './supabase';
import type {
  Court,
  Coach,
  Equipment,
  PricingRule,
  Booking,
  BookingWithDetails,
  Profile,
  AvailabilityCheck,
  BookingFormData,
  PriceCalculation,
  PricingModifier,
  Waitlist,
  WaitlistWithDetails,
  WaitlistPosition
} from '@/types/types';

export const courtsApi = {
  async getAll(): Promise<Court[]> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<Court | null> {
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create(court: Omit<Court, 'id' | 'created_at'>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .insert([court])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create court');
    return data;
  },

  async update(id: string, updates: Partial<Court>): Promise<Court> {
    const { data, error } = await supabase
      .from('courts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update court');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const coachesApi = {
  async getAll(): Promise<Coach[]> {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<Coach | null> {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create(coach: Omit<Coach, 'id' | 'created_at'>): Promise<Coach> {
    const { data, error } = await supabase
      .from('coaches')
      .insert([coach])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create coach');
    return data;
  },

  async update(id: string, updates: Partial<Coach>): Promise<Coach> {
    const { data, error } = await supabase
      .from('coaches')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update coach');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('coaches')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const equipmentApi = {
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('type', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByType(type: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('type', type)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Equipment>): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update equipment');
    return data;
  }
};

export const pricingRulesApi = {
  async getAll(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getActive(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async create(rule: Omit<PricingRule, 'id' | 'created_at'>): Promise<PricingRule> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .insert([rule])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create pricing rule');
    return data;
  },

  async update(id: string, updates: Partial<PricingRule>): Promise<PricingRule> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update pricing rule');
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

export const bookingsApi = {
  async getAll(): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        court:courts(*),
        coach:coaches(*),
        user:profiles(*)
      `)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getByUserId(userId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        court:courts(*),
        coach:coaches(*)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<BookingWithDetails | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        court:courts(*),
        coach:coaches(*),
        user:profiles(*)
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async checkAvailability(params: {
    court_id: string;
    start_time: string;
    end_time: string;
    coach_id?: string;
    racket_count?: number;
    shoes_count?: number;
  }): Promise<AvailabilityCheck> {
    const { data, error } = await supabase.rpc('check_booking_availability', {
      p_court_id: params.court_id,
      p_start_time: params.start_time,
      p_end_time: params.end_time,
      p_coach_id: params.coach_id || null,
      p_racket_count: params.racket_count || 0,
      p_shoes_count: params.shoes_count || 0
    });
    
    if (error) throw error;
    return data as AvailabilityCheck;
  },

  async create(booking: BookingFormData & {
    user_id: string;
    base_price: number;
    pricing_modifiers: PricingModifier[];
    equipment_fee: number;
    coach_fee: number;
    total_price: number;
  }): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create booking');
    return data;
  },

  async cancel(id: string): Promise<void> {
    const { data, error } = await supabase.rpc('cancel_booking_with_waitlist', {
      p_booking_id: id
    });

    if (error) throw error;
  }
};

export const profilesApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateRole(userId: string, role: 'user' | 'admin'): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update user role');
    return data;
  }
};

export const pricingApi = {
  async calculatePrice(params: {
    court_id: string;
    start_time: string;
    end_time: string;
    coach_id?: string;
    racket_count?: number;
    shoes_count?: number;
  }): Promise<PriceCalculation> {
    const court = await courtsApi.getById(params.court_id);
    if (!court) throw new Error('Court not found');

    const startDate = new Date(params.start_time);
    const endDate = new Date(params.end_time);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    let base_price = court.base_price * hours;
    const pricing_modifiers: PricingModifier[] = [];

    const rules = await pricingRulesApi.getActive();
    const dayOfWeek = startDate.getDay();
    const timeStr = startDate.toTimeString().slice(0, 5);

    for (const rule of rules) {
      let applies = false;

      if (rule.rule_type === 'peak_hour' && rule.start_time && rule.end_time) {
        if (timeStr >= rule.start_time && timeStr < rule.end_time) {
          if (!rule.days_of_week || rule.days_of_week.includes(dayOfWeek)) {
            applies = true;
          }
        }
      } else if (rule.rule_type === 'weekend') {
        if (rule.days_of_week && rule.days_of_week.includes(dayOfWeek)) {
          applies = true;
        }
      } else if (rule.rule_type === 'premium_court') {
        if (court.type === 'indoor') {
          applies = true;
        }
      }

      if (applies) {
        if (rule.multiplier !== 1.0) {
          const modifier_amount = base_price * (rule.multiplier - 1);
          pricing_modifiers.push({
            rule_name: rule.name,
            rule_type: rule.rule_type,
            amount: modifier_amount,
            type: 'multiplier'
          });
          base_price *= rule.multiplier;
        }
        if (rule.surcharge > 0) {
          pricing_modifiers.push({
            rule_name: rule.name,
            rule_type: rule.rule_type,
            amount: rule.surcharge,
            type: 'surcharge'
          });
          base_price += rule.surcharge;
        }
      }
    }

    let equipment_fee = 0;
    if (params.racket_count) {
      const racketEquip = await equipmentApi.getByType('racket');
      equipment_fee += (racketEquip?.rental_price || 0) * params.racket_count;
    }
    if (params.shoes_count) {
      const shoesEquip = await equipmentApi.getByType('shoes');
      equipment_fee += (shoesEquip?.rental_price || 0) * params.shoes_count;
    }

    let coach_fee = 0;
    if (params.coach_id) {
      const coach = await coachesApi.getById(params.coach_id);
      coach_fee = (coach?.hourly_rate || 0) * hours;
    }

    const total_price = base_price + equipment_fee + coach_fee;

    return {
      base_price: court.base_price * hours,
      pricing_modifiers,
      equipment_fee,
      coach_fee,
      total_price
    };
  }
};

export const waitlistApi = {
  async join(params: {
    court_id: string;
    start_time: string;
    end_time: string;
    coach_id?: string;
    racket_count?: number;
    shoes_count?: number;
  }): Promise<{ success: boolean; waitlist_id: string; position: number }> {
    const { data, error } = await supabase.rpc('join_waitlist', {
      p_court_id: params.court_id,
      p_start_time: params.start_time,
      p_end_time: params.end_time,
      p_coach_id: params.coach_id || null,
      p_racket_count: params.racket_count || 0,
      p_shoes_count: params.shoes_count || 0
    });

    if (error) throw error;
    return data;
  },

  async getPosition(params: {
    court_id: string;
    start_time: string;
    end_time: string;
  }): Promise<WaitlistPosition> {
    const { data, error } = await supabase.rpc('get_waitlist_position', {
      p_court_id: params.court_id,
      p_start_time: params.start_time,
      p_end_time: params.end_time
    });

    if (error) throw error;
    return data;
  },

  async getByUserId(userId: string): Promise<WaitlistWithDetails[]> {
    const { data, error } = await supabase
      .from('waitlist')
      .select(`
        *,
        user:profiles!waitlist_user_id_fkey(id, username, email),
        court:courts!waitlist_court_id_fkey(id, name, type),
        coach:coaches!waitlist_coach_id_fkey(id, name, hourly_rate)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getAll(): Promise<WaitlistWithDetails[]> {
    const { data, error } = await supabase
      .from('waitlist')
      .select(`
        *,
        user:profiles!waitlist_user_id_fkey(id, username, email),
        court:courts!waitlist_court_id_fkey(id, name, type),
        coach:coaches!waitlist_coach_id_fkey(id, name, hourly_rate)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};