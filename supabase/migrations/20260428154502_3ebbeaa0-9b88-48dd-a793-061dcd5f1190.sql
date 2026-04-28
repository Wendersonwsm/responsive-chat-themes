WITH new_cats(name, icon, color, subcategories, sort_order) AS (
  VALUES
    ('Educação','GraduationCap','#0ea5e9','["Cursos","Livros","Mensalidade"]'::jsonb, 7),
    ('Pets','PawPrint','#f59e0b','["Ração","Veterinário","Petshop"]'::jsonb, 8),
    ('Vestuário','Shirt','#ec4899','["Roupas","Calçados","Acessórios"]'::jsonb, 9),
    ('Beleza','Sparkles','#a855f7','["Cabelo","Estética","Cosméticos"]'::jsonb, 10),
    ('Investimentos','TrendingUp','#10b981','["Ações","Renda fixa","Cripto"]'::jsonb, 11),
    ('Cartão','CreditCard','#ef4444','["Fatura","Anuidade"]'::jsonb, 12),
    ('Impostos','Landmark','#64748b','["IPTU","IPVA","IR"]'::jsonb, 13),
    ('Assinaturas','Tv','#8b5cf6','["Streaming","Apps","Software"]'::jsonb, 14),
    ('Presentes','Gift','#f43f5e','["Aniversário","Datas"]'::jsonb, 15),
    ('Trabalho','Briefcase','#0891b2','["Material","Transporte","Ferramentas"]'::jsonb, 16)
)
INSERT INTO public.categories (user_id, name, icon, color, subcategories, sort_order)
SELECT p.id, nc.name, nc.icon, nc.color, nc.subcategories, nc.sort_order
FROM public.profiles p
CROSS JOIN new_cats nc
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.user_id = p.id AND c.name = nc.name
);

UPDATE public.categories SET icon = 'Home' WHERE name = 'Moradia' AND icon != 'Home';
UPDATE public.categories SET icon = 'UtensilsCrossed' WHERE name = 'Alimentação' AND icon != 'UtensilsCrossed';
UPDATE public.categories SET icon = 'Car' WHERE name = 'Transporte' AND icon != 'Car';
UPDATE public.categories SET icon = 'HeartPulse' WHERE name = 'Saúde' AND icon != 'HeartPulse';
UPDATE public.categories SET icon = 'Gamepad2' WHERE name = 'Lazer' AND icon != 'Gamepad2';
UPDATE public.categories SET icon = 'MoreHorizontal' WHERE name = 'Outros' AND icon != 'MoreHorizontal';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  insert into public.categories (user_id, name, icon, color, subcategories, sort_order) values
    (new.id, 'Moradia', 'Home', '#2563eb', '["Aluguel","Condomínio","Energia","Água","Internet"]'::jsonb, 1),
    (new.id, 'Alimentação', 'UtensilsCrossed', '#059669', '["Mercado","Restaurante","Delivery"]'::jsonb, 2),
    (new.id, 'Transporte', 'Car', '#d97706', '["Combustível","Transporte App","Manutenção"]'::jsonb, 3),
    (new.id, 'Saúde', 'HeartPulse', '#dc2626', '["Plano","Farmácia","Consultas"]'::jsonb, 4),
    (new.id, 'Lazer', 'Gamepad2', '#7c3aed', '["Streaming","Cinema","Viagens"]'::jsonb, 5),
    (new.id, 'Educação', 'GraduationCap', '#0ea5e9', '["Cursos","Livros","Mensalidade"]'::jsonb, 6),
    (new.id, 'Pets', 'PawPrint', '#f59e0b', '["Ração","Veterinário","Petshop"]'::jsonb, 7),
    (new.id, 'Vestuário', 'Shirt', '#ec4899', '["Roupas","Calçados","Acessórios"]'::jsonb, 8),
    (new.id, 'Beleza', 'Sparkles', '#a855f7', '["Cabelo","Estética","Cosméticos"]'::jsonb, 9),
    (new.id, 'Investimentos', 'TrendingUp', '#10b981', '["Ações","Renda fixa","Cripto"]'::jsonb, 10),
    (new.id, 'Cartão', 'CreditCard', '#ef4444', '["Fatura","Anuidade"]'::jsonb, 11),
    (new.id, 'Impostos', 'Landmark', '#64748b', '["IPTU","IPVA","IR"]'::jsonb, 12),
    (new.id, 'Assinaturas', 'Tv', '#8b5cf6', '["Streaming","Apps","Software"]'::jsonb, 13),
    (new.id, 'Presentes', 'Gift', '#f43f5e', '["Aniversário","Datas"]'::jsonb, 14),
    (new.id, 'Trabalho', 'Briefcase', '#0891b2', '["Material","Transporte","Ferramentas"]'::jsonb, 15),
    (new.id, 'Outros', 'MoreHorizontal', '#6b7280', '[]'::jsonb, 99);
  return new;
end;
$function$;