-- 刪除由 CSV 建立的歷史快照 (Snapshots)
-- 由於有設定 ON DELETE CASCADE，刪除 Snapshots 會自動連帶刪除對應的 snapshot_records (歷史明細)
DELETE FROM snapshots
WHERE notes = 'Imported from historical CSV';

-- 刪除沒有被任何快照或紀錄引用的孤立資產 (Assets)
-- 這能幫你清掉剛才因為 CSV 匯入錯誤而建立，且沒有被真正使用到的資產
DELETE FROM assets
WHERE id NOT IN (
    SELECT DISTINCT asset_id FROM snapshot_records
) 
AND id NOT IN (
    SELECT DISTINCT asset_id FROM goal_asset_mapping
);
