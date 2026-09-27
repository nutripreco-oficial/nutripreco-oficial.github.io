-- ==============================================================================
-- NUTRIPREÇO — SCHEMA COMPLETO E POLÍTICAS DE SEGURANÇA (RLS) PARA O SUPABASE
-- ==============================================================================
-- Este script pode ser colado e executado diretamente no SQL Editor do Supabase.
-- Ele cria todas as tabelas necessárias, índices de performance, funções de
-- moderação e políticas estritas de Row Level Security (RLS) em conformidade com
-- a LGPD e as diretrizes de SECURITY.md.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. FUNÇÃO AUXILIAR DE SEGURANÇA: is_admin()
-- ==============================================================================
-- Verifica se o usuário autenticado na requisição possui um dos e-mails de
-- administração ou a claim admin no JWT do Supabase Auth.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') IN ('arthurlvdss@gmail.com', 'contato.nutripreco@gmail.com'),
    false
  );
$$;

-- ==============================================================================
-- 3. CRIAÇÃO DAS TABELAS COM CONSTRAINTS
-- ==============================================================================

-- Tabela: PRODUTOS (Catálogo de itens e códigos EAN)
CREATE TABLE IF NOT EXISTS public.produtos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_barras TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL CHECK (length(trim(nome)) > 0),
    marca TEXT DEFAULT '',
    categoria TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: MERCADOS (Supermercados, atacarejos e mercearias)
CREATE TABLE IF NOT EXISTS public.mercados (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome TEXT NOT NULL CHECK (length(trim(nome)) > 0),
    cidade TEXT NOT NULL DEFAULT 'Cabo Frio',
    bairro TEXT DEFAULT '',
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: REGISTROS_PRECOS (Cotações colaborativas de gôndola)
CREATE TABLE IF NOT EXISTS public.registros_precos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    produto_id BIGINT NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    mercado_id BIGINT NOT NULL REFERENCES public.mercados(id) ON DELETE CASCADE,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco > 0 AND preco < 50000),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    data_registro TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: APP_TELEMETRIA (Diagnósticos técnicos mínimos e anônimos)
CREATE TABLE IF NOT EXISTS public.app_telemetria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    evento TEXT NOT NULL,
    device_id TEXT NOT NULL,
    cidade TEXT DEFAULT 'Cabo Frio',
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: ENCARTES (Fotos de folhetos e ofertas vigentes)
CREATE TABLE IF NOT EXISTS public.encartes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mercado TEXT NOT NULL,
    cidade TEXT NOT NULL DEFAULT 'Cabo Frio',
    data_inicio DATE DEFAULT CURRENT_DATE NOT NULL,
    validade DATE NOT NULL,
    imagem TEXT NOT NULL,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 4. ÍNDICES DE PERFORMANCE (VELOCIDADE NAS GÔNDOLAS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos(nome);
CREATE INDEX IF NOT EXISTS idx_mercados_nome ON public.mercados(nome);
CREATE INDEX IF NOT EXISTS idx_mercados_cidade ON public.mercados(cidade);
CREATE INDEX IF NOT EXISTS idx_registros_precos_produto ON public.registros_precos(produto_id, data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_registros_precos_mercado ON public.registros_precos(mercado_id);
CREATE INDEX IF NOT EXISTS idx_registros_precos_data ON public.registros_precos(data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_encartes_vigencia ON public.encartes(cidade, validade DESC);
CREATE INDEX IF NOT EXISTS idx_telemetria_evento ON public.app_telemetria(evento, created_at DESC);

-- ==============================================================================
-- 5. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_telemetria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encartes ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. POLÍTICAS DE RLS — TABELA: PRODUTOS
-- ==============================================================================
-- Qualquer usuário (visitante ou cadastrado) pode consultar produtos existentes
DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;
CREATE POLICY "produtos_select_policy" ON public.produtos
    FOR SELECT TO public
    USING (true);

-- Permite cadastro/upsert de novos produtos pela gôndola
DROP POLICY IF EXISTS "produtos_insert_policy" ON public.produtos;
CREATE POLICY "produtos_insert_policy" ON public.produtos
    FOR INSERT TO public
    WITH CHECK (length(trim(nome)) > 0 AND length(trim(codigo_barras)) >= 6);

-- Moderação ou correção de nome/marca: administradores ou usuários logados
DROP POLICY IF EXISTS "produtos_update_policy" ON public.produtos;
CREATE POLICY "produtos_update_policy" ON public.produtos
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR auth.uid() IS NOT NULL)
    WITH CHECK (length(trim(nome)) > 0);

-- Exclusão de itens (limpeza de testes): restrito a administradores
DROP POLICY IF EXISTS "produtos_delete_policy" ON public.produtos;
CREATE POLICY "produtos_delete_policy" ON public.produtos
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 7. POLÍTICAS DE RLS — TABELA: MERCADOS
-- ==============================================================================
DROP POLICY IF EXISTS "mercados_select_policy" ON public.mercados;
CREATE POLICY "mercados_select_policy" ON public.mercados
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "mercados_insert_policy" ON public.mercados;
CREATE POLICY "mercados_insert_policy" ON public.mercados
    FOR INSERT TO public
    WITH CHECK (length(trim(nome)) > 0);

DROP POLICY IF EXISTS "mercados_update_policy" ON public.mercados;
CREATE POLICY "mercados_update_policy" ON public.mercados
    FOR UPDATE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "mercados_delete_policy" ON public.mercados;
CREATE POLICY "mercados_delete_policy" ON public.mercados
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 8. POLÍTICAS DE RLS — TABELA: REGISTROS_PRECOS
-- ==============================================================================
DROP POLICY IF EXISTS "precos_select_policy" ON public.registros_precos;
CREATE POLICY "precos_select_policy" ON public.registros_precos
    FOR SELECT TO public
    USING (true);

-- Inserção de cotações com validação de faixa de preço coerente
DROP POLICY IF EXISTS "precos_insert_policy" ON public.registros_precos;
CREATE POLICY "precos_insert_policy" ON public.registros_precos
    FOR INSERT TO public
    WITH CHECK (preco > 0 AND preco < 50000);

-- Apenas o próprio autor da cotação ou o administrador pode alterar
DROP POLICY IF EXISTS "precos_update_policy" ON public.registros_precos;
CREATE POLICY "precos_update_policy" ON public.registros_precos
    FOR UPDATE TO authenticated
    USING (public.is_admin() OR auth.uid() = usuario_id);

-- Apenas o próprio autor ou o administrador pode excluir uma cotação
DROP POLICY IF EXISTS "precos_delete_policy" ON public.registros_precos;
CREATE POLICY "precos_delete_policy" ON public.registros_precos
    FOR DELETE TO authenticated
    USING (public.is_admin() OR auth.uid() = usuario_id);

-- ==============================================================================
-- 9. POLÍTICAS DE RLS — TABELA: APP_TELEMETRIA
-- ==============================================================================
-- Telemetria é sigilosa e para diagnóstico: apenas administradores podem ler
DROP POLICY IF EXISTS "telemetria_select_policy" ON public.app_telemetria;
CREATE POLICY "telemetria_select_policy" ON public.app_telemetria
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Qualquer dispositivo (cliente PWA) pode enviar eventos anônimos
DROP POLICY IF EXISTS "telemetria_insert_policy" ON public.app_telemetria;
CREATE POLICY "telemetria_insert_policy" ON public.app_telemetria
    FOR INSERT TO public
    WITH CHECK (length(trim(evento)) > 0 AND length(trim(device_id)) > 0);

-- Imutabilidade: nenhum cliente pode atualizar eventos passados
DROP POLICY IF EXISTS "telemetria_update_policy" ON public.app_telemetria;
CREATE POLICY "telemetria_update_policy" ON public.app_telemetria
    FOR UPDATE TO authenticated
    USING (false);

-- Apenas administradores podem expurgar dados antigos de telemetria
DROP POLICY IF EXISTS "telemetria_delete_policy" ON public.app_telemetria;
CREATE POLICY "telemetria_delete_policy" ON public.app_telemetria
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 10. POLÍTICAS DE RLS — TABELA: ENCARTES
-- ==============================================================================
-- Encartes vigentes são públicos para consulta
DROP POLICY IF EXISTS "encartes_select_policy" ON public.encartes;
CREATE POLICY "encartes_select_policy" ON public.encartes
    FOR SELECT TO public
    USING (validade >= (CURRENT_DATE - INTERVAL '1 day') OR public.is_admin());

-- Apenas administradores ou usuários logados podem publicar encartes
DROP POLICY IF EXISTS "encartes_insert_policy" ON public.encartes;
CREATE POLICY "encartes_insert_policy" ON public.encartes
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

-- Moderação de encartes: exclusivo de administradores
DROP POLICY IF EXISTS "encartes_update_policy" ON public.encartes;
CREATE POLICY "encartes_update_policy" ON public.encartes
    FOR UPDATE TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "encartes_delete_policy" ON public.encartes;
CREATE POLICY "encartes_delete_policy" ON public.encartes
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 11. PROCEDIMENTO LGPD: EXCLUSÃO REAL E ANONIMIZAÇÃO DE CONTA
-- ==============================================================================
-- Permite que um usuário autenticado solicite a exclusão de sua conta.
-- Os preços registrados por ele são anonimizados (usuario_id = NULL) para preservar
-- as estatísticas de consumo da comunidade sem manter nenhum vínculo com dados pessoais.
CREATE OR REPLACE FUNCTION public.excluir_minha_conta_lgpd()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- 1. Anonimizar referências de preços para desvincular dados pessoais
    UPDATE public.registros_precos
    SET usuario_id = NULL
    WHERE usuario_id = current_user_id;

    UPDATE public.encartes
    SET usuario_id = NULL
    WHERE usuario_id = current_user_id;

    -- 2. Remover usuário da autenticação do Supabase
    DELETE FROM auth.users
    WHERE id = current_user_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Conta e vínculos pessoais excluídos com sucesso em conformidade com a LGPD.'
    );
END;
$$;

-- Permite que usuários autenticados invoquem a função de exclusão
GRANT EXECUTE ON FUNCTION public.excluir_minha_conta_lgpd() TO authenticated;

-- ==============================================================================
-- 12. STORAGE BUCKET (SE UTILIZADO PARA FOTOS DE ENCARTES)
-- ==============================================================================
-- Para criar o bucket via SQL caso deseje hospedar fotos via Supabase Storage:
INSERT INTO storage.buckets (id, name, public)
VALUES ('encartes', 'encartes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Leitura pública das fotos do bucket encartes
DROP POLICY IF EXISTS "Storage Encartes Leitura Publica" ON storage.objects;
CREATE POLICY "Storage Encartes Leitura Publica" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'encartes');

-- Upload permitido para administradores ou usuários logados
DROP POLICY IF EXISTS "Storage Encartes Upload Autenticado" ON storage.objects;
CREATE POLICY "Storage Encartes Upload Autenticado" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'encartes' AND (public.is_admin() OR auth.uid() IS NOT NULL));

-- Exclusão de imagens restrita ao administrador
DROP POLICY IF EXISTS "Storage Encartes Exclusao Admin" ON storage.objects;
CREATE POLICY "Storage Encartes Exclusao Admin" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'encartes' AND public.is_admin());
