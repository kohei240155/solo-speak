#!/usr/bin/env python3
"""
未使用i18nキー削除スクリプト
特定の未使用キーを両方の言語ファイルから削除します
"""

import json
import os
from typing import Dict, Any

def remove_nested_key(data: Dict[str, Any], key_path: str) -> bool:
    """ネストされたキーを削除"""
    keys = key_path.split('.')
    current = data
    
    # 最後のキーの親まで辿る
    for key in keys[:-1]:
        if key not in current or not isinstance(current[key], dict):
            return False
        current = current[key]
    
    # 最後のキーを削除
    last_key = keys[-1]
    if last_key in current:
        del current[last_key]
        return True
    return False

def clean_empty_objects(data: Dict[str, Any]) -> Dict[str, Any]:
    """空のオブジェクトを削除"""
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            if isinstance(value, dict):
                cleaned_value = clean_empty_objects(value)
                if cleaned_value:  # 空でない場合のみ追加
                    cleaned[key] = cleaned_value
            else:
                cleaned[key] = value
        return cleaned
    return data

def save_json_file(file_path: str, data: Dict[str, Any]) -> bool:
    """JSONファイルを保存"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        return False

def main():
    # ファイルパス
    ja_file = r"c:\Git\solo-speak\public\locales\ja\common.json"
    en_file = r"c:\Git\solo-speak\public\locales\en\common.json"
    
    # 削除対象のキー
    keys_to_remove = [
        'speak.modal.startFrom',
        'speak.modal.options.newest', 
        'speak.modal.options.oldest',
        'home.hero.cta.mobile'
    ]
    
    print("🗑️  未使用i18nキー削除スクリプト")
    print("=" * 50)
    
    for file_path in [ja_file, en_file]:
        print(f"\n📝 処理中: {os.path.basename(file_path)}")
        
        # ファイル読み込み
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ 読み込みエラー: {e}")
            continue
            
        # バックアップ作成
        backup_path = file_path + '.backup'
        try:
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"💾 バックアップ作成: {backup_path}")
        except Exception as e:
            print(f"⚠️  バックアップ作成失敗: {e}")
        
        # キー削除
        removed_count = 0
        for key in keys_to_remove:
            if remove_nested_key(data, key):
                print(f"  ✅ 削除: {key}")
                removed_count += 1
            else:
                print(f"  ⚠️  見つからない: {key}")
        
        # 空のオブジェクトをクリーンアップ
        data = clean_empty_objects(data)
        
        # ファイル保存
        if save_json_file(file_path, data):
            print(f"💾 保存完了: {removed_count}個のキーを削除")
        else:
            print("❌ 保存失敗")
    
    print("\n🎉 処理完了！")
    print("変更を確認してください。問題がある場合は .backup ファイルから復元できます。")

if __name__ == "__main__":
    main()
