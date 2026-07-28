
CREATE TABLE public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

INSERT INTO public.app_settings (id, data) VALUES (
  'default',
  jsonb_build_object(
    'brand', 'Cinco Patas Dog Car & Walker',
    'brand_short', 'Cinco Patas',
    'whatsapp_number', '5521992244753',
    'phone_display', '(21) 99224-4753',
    'instagram_handle', '@cincopatasdogcar',
    'city_base', 'Alcântara, São Gonçalo (RJ)',
    'base_coords', jsonb_build_object('lat', -22.7876, 'lon', -43.0244),
    'cities_covered', jsonb_build_array('São Gonçalo', 'Niterói', 'Maricá', 'Itaboraí'),
    'schedule_display', 'Todos os dias · 07h – 20h',
    'fuel_cost_per_km', 0.34,
    'taxi_per_km_pet', 4,
    'taxi_per_km_human', 5,
    'taxi_min_price', 30,
    'walker_min_price', 30,
    'walker_travel_fee_per_km_over', 0.6,
    'walker_travel_fee_km_threshold', 4,
    'wait_time_free_min', 30,
    'wait_time_fee', 15,
    'wait_time_fee_min_block', 30,
    'hygiene_fee_min', 15,
    'hygiene_fee_max', 40,
    'combo_aventurinha_discount', 0.10,
    'combo_vip_discount', 0.15,
    'monthly_pkg_discount', 0.10,
    'second_pet_discount', 0.50,
    'cancel_free_hours', 2,
    'walker_price_by_porte', jsonb_build_object(
      'pequeno', 32.5, 'medio', 37.5, 'grande', 45, 'gigante', 57.5
    ),
    'porte_options', jsonb_build_array(
      jsonb_build_object('id', 'pequeno', 'label', 'Pequeno', 'weight', 'Até 10 kg'),
      jsonb_build_object('id', 'medio',   'label', 'Médio',   'weight', '11–25 kg'),
      jsonb_build_object('id', 'grande',  'label', 'Grande',  'weight', '26–45 kg'),
      jsonb_build_object('id', 'gigante', 'label', 'Gigante', 'weight', '45 kg +')
    ),
    'monthly_tiers', jsonb_build_array(
      jsonb_build_object('tier', 'Bronze', 'freq', 2, 'label', '2x na semana'),
      jsonb_build_object('tier', 'Prata',  'freq', 3, 'label', '3x na semana'),
      jsonb_build_object('tier', 'Ouro',   'freq', 5, 'label', '5x na semana', 'accent', true)
    ),
    'walk_time_options', jsonb_build_array(
      jsonb_build_object('min', 30, 'label', '30 min', 'factor', 0.6),
      jsonb_build_object('min', 60, 'label', '1 hora', 'factor', 1),
      jsonb_build_object('min', 90, 'label', '1h30',   'factor', 1.4)
    )
  )
);
