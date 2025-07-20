-- 本番環境用: 既存フレーズのレベル更新SQL
-- 注意: 実行前に必ずバックアップを取得してください

-- 現在のフレーズとレベルの状況を確認
SELECT 
  p.id,
  p.text,
  p.translation,
  p.correct_quiz_count,
  pl.name as current_level,
  pl.score as current_score,
  pl.color as current_color
FROM phrases p
JOIN phrase_levels pl ON p.phrase_level_id = pl.id
WHERE p.deleted_at IS NULL
ORDER BY p.correct_quiz_count DESC
LIMIT 20;

-- 正解数に基づく適切なレベルの算出関数（SQLで実装）
-- この関数は実際の判定ロジックと同じです：閾値 [30, 20, 10, 5, 3, 1, 0] で大きい順に判定

CREATE OR REPLACE FUNCTION get_phrase_level_score(correct_answers INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF correct_answers >= 30 THEN RETURN 30;
  ELSIF correct_answers >= 20 THEN RETURN 20;
  ELSIF correct_answers >= 10 THEN RETURN 10;
  ELSIF correct_answers >= 5 THEN RETURN 5;
  ELSIF correct_answers >= 3 THEN RETURN 3;
  ELSIF correct_answers >= 1 THEN RETURN 1;
  ELSE RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- フレーズの期待レベルと現在レベルを比較
SELECT 
  p.id,
  p.text,
  p.correct_quiz_count,
  get_phrase_level_score(p.correct_quiz_count) as expected_score,
  pl.score as current_score,
  pl.name as current_level,
  CASE 
    WHEN get_phrase_level_score(p.correct_quiz_count) != pl.score THEN '更新が必要'
    ELSE '正常'
  END as status
FROM phrases p
JOIN phrase_levels pl ON p.phrase_level_id = pl.id
WHERE p.deleted_at IS NULL
ORDER BY p.correct_quiz_count DESC;

-- 更新が必要なフレーズの数を確認
SELECT 
  COUNT(*) as total_phrases,
  COUNT(CASE WHEN get_phrase_level_score(p.correct_quiz_count) != pl.score THEN 1 END) as needs_update
FROM phrases p
JOIN phrase_levels pl ON p.phrase_level_id = pl.id
WHERE p.deleted_at IS NULL;

-- 実際にフレーズレベルを更新
-- 注意: この操作は不可逆です。実行前に必ずバックアップを取得してください。

UPDATE phrases 
SET 
  phrase_level_id = (
    SELECT pl_new.id 
    FROM phrase_levels pl_new 
    WHERE pl_new.score = get_phrase_level_score(phrases.correct_quiz_count)
    AND pl_new.deleted_at IS NULL
    LIMIT 1
  ),
  updated_at = NOW()
WHERE 
  deleted_at IS NULL
  AND phrase_level_id != (
    SELECT pl_check.id 
    FROM phrase_levels pl_check 
    WHERE pl_check.score = get_phrase_level_score(phrases.correct_quiz_count)
    AND pl_check.deleted_at IS NULL
    LIMIT 1
  );

-- 更新結果の確認
SELECT 
  pl.name,
  pl.score,
  pl.color,
  COUNT(p.id) as phrase_count
FROM phrase_levels pl
LEFT JOIN phrases p ON pl.id = p.phrase_level_id AND p.deleted_at IS NULL
WHERE pl.deleted_at IS NULL
GROUP BY pl.id, pl.name, pl.score, pl.color
ORDER BY pl.score;

-- 更新後の状況確認（サンプル）
SELECT 
  p.id,
  p.text,
  p.correct_quiz_count,
  pl.name as level_name,
  pl.score as level_score,
  pl.color
FROM phrases p
JOIN phrase_levels pl ON p.phrase_level_id = pl.id
WHERE p.deleted_at IS NULL
ORDER BY p.correct_quiz_count DESC
LIMIT 20;

-- 関数のクリーンアップ（必要に応じて）
-- DROP FUNCTION IF EXISTS get_phrase_level_score(INTEGER);
