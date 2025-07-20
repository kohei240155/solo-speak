-- 本番環境用: phrase_levelsテーブルにcolorカラム追加
-- Supabase SQL Editorで実行してください

-- Step 1: テーブル構造の確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'phrase_levels' 
ORDER BY ordinal_position;

-- Step 2: colorカラムの存在確認と追加
DO $$
BEGIN
    -- colorカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'phrase_levels' 
        AND column_name = 'color'
        AND table_schema = 'public'
    ) THEN
        -- カラムを追加（VARCHAR(7)でNULL許可）
        ALTER TABLE phrase_levels ADD COLUMN color VARCHAR(7);
        
        -- インデックスは特に不要（頻繁に検索されないため）
        
        RAISE NOTICE 'phrase_levelsテーブルにcolorカラム(VARCHAR(7))を追加しました';
    ELSE
        RAISE NOTICE 'colorカラムは既に存在します';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'エラーが発生しました: %', SQLERRM;
        RAISE;
END $$;

-- Step 3: 追加後のテーブル構造確認
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'phrase_levels' 
ORDER BY ordinal_position;

-- Step 4: 既存データの確認
SELECT 
    id, 
    name, 
    score, 
    color,
    created_at 
FROM phrase_levels 
WHERE deleted_at IS NULL 
ORDER BY score ASC;
