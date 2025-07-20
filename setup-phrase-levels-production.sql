-- 本番環境用フレーズレベルセットアップSQL
-- Supabase SQL Editorで実行してください

-- Step 1: colorカラムの存在確認と追加
DO $$
BEGIN
    -- colorカラムが存在しない場合は追加
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'phrase_levels' 
        AND column_name = 'color'
    ) THEN
        ALTER TABLE phrase_levels ADD COLUMN color VARCHAR(7);
        RAISE NOTICE 'colorカラムを追加しました';
    ELSE
        RAISE NOTICE 'colorカラムは既に存在します';
    END IF;
END $$;

-- Step 2: 既存のフレーズレベル状況を確認
SELECT id, name, score, color, created_at 
FROM phrase_levels 
WHERE deleted_at IS NULL 
ORDER BY score ASC;

-- フレーズの参照状況を確認
SELECT pl.name, pl.score, COUNT(p.id) as phrase_count
FROM phrase_levels pl
LEFT JOIN phrases p ON pl.id = p.phrase_level_id AND p.deleted_at IS NULL
WHERE pl.deleted_at IS NULL
GROUP BY pl.id, pl.name, pl.score
ORDER BY pl.score;

-- 必要なフレーズレベルを作成（存在しない場合のみ）

-- Level 1 (score: 0) - 正解数 = 0
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 0 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 1', 0, '#D9D9D9', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 1', color = '#D9D9D9', updated_at = NOW()
    WHERE score = 0 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 2 (score: 1) - 正解数 >= 1
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 1 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 2', 1, '#BFBFBF', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 2', color = '#BFBFBF', updated_at = NOW()
    WHERE score = 1 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 3 (score: 3) - 正解数 >= 3
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 3 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 3', 3, '#A6A6A6', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 3', color = '#A6A6A6', updated_at = NOW()
    WHERE score = 3 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 4 (score: 5) - 正解数 >= 5
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 5 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 4', 5, '#8C8C8C', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 4', color = '#8C8C8C', updated_at = NOW()
    WHERE score = 5 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 5 (score: 10) - 正解数 >= 10
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 10 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 5', 10, '#737373', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 5', color = '#737373', updated_at = NOW()
    WHERE score = 10 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 6 (score: 20) - 正解数 >= 20
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 20 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 6', 20, '#595959', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 6', color = '#595959', updated_at = NOW()
    WHERE score = 20 AND deleted_at IS NULL;
  END IF;
END $$;

-- Level 7 (score: 30) - 正解数 >= 30
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phrase_levels WHERE score = 30 AND deleted_at IS NULL) THEN
    INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Level 7', 30, '#404040', NOW(), NOW());
  ELSE
    UPDATE phrase_levels 
    SET name = 'Level 7', color = '#404040', updated_at = NOW()
    WHERE score = 30 AND deleted_at IS NULL;
  END IF;
END $$;

-- 最終結果確認
SELECT id, name, score, color, created_at 
FROM phrase_levels 
WHERE deleted_at IS NULL 
ORDER BY score ASC;

-- 各レベルのフレーズ数確認
SELECT pl.name, pl.score, pl.color, COUNT(p.id) as phrase_count
FROM phrase_levels pl
LEFT JOIN phrases p ON pl.id = p.phrase_level_id AND p.deleted_at IS NULL
WHERE pl.deleted_at IS NULL
GROUP BY pl.id, pl.name, pl.score, pl.color
ORDER BY pl.score;
