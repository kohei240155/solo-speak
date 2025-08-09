#!/usr/bin/env python3
"""
i18n翻訳キーの使用状況をチェックするスクリプト
1. 日本語版と英語版のキーの一致確認
2. 未使用のキーの検出
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, Set, List, Tuple

def load_json_file(file_path: str) -> Dict:
    """JSONファイルを読み込む"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return {}

def flatten_dict(d: Dict, parent_key: str = '', sep: str = '.') -> Dict[str, str]:
    """ネストされた辞書を平坦化"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def search_usage_in_files(key: str, search_dirs: List[str]) -> List[str]:
    """ファイル内でキーの使用を検索"""
    usage_files = []
    
    # キーのバリエーションを作成（より精密な検索）
    key_variations = [
        f'"{key}"',           # "key"
        f"'{key}'",           # 'key'
        f"`{key}`",           # `key`
        f"t('{key}')",        # t('key')
        f't("{key}")',        # t("key")
        f"t(`{key}`)",        # t(`key`)
        f"i18n.t('{key}')",   # i18n.t('key')
        f'i18n.t("{key}")',   # i18n.t("key")
        # ドット記法での部分一致も検索
        key.split('.')[-1] if '.' in key else key,  # 最後の部分のみ
    ]
    
    for search_dir in search_dirs:
        for file_path in Path(search_dir).rglob('*'):
            if (file_path.suffix in ['.tsx', '.ts', '.js', '.jsx'] and 
                not any(ignore in str(file_path) for ignore in ['node_modules', '.git', 'dist', 'build'])):
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # より精密な検索
                    for variation in key_variations:
                        if variation in content:
                            # より詳細な確認: 実際にそのキーが使われているかチェック
                            if key in content or key.replace('.', '\\.') in content:
                                usage_files.append(str(file_path))
                                break
                            
                except Exception:
                    continue
                    
    return usage_files

def main():
    # ファイルパス
    ja_file = r"c:\Git\solo-speak\public\locales\ja\common.json"
    en_file = r"c:\Git\solo-speak\public\locales\en\common.json"
    
    # 検索対象ディレクトリ
    search_dirs = [
        r"c:\Git\solo-speak\src",
        r"c:\Git\solo-speak\components",
    ]
    
    print("🔍 i18n翻訳キーの使用状況をチェック中...")
    print("=" * 50)
    
    # 1. JSONファイルの読み込み
    ja_data = load_json_file(ja_file)
    en_data = load_json_file(en_file)
    
    if not ja_data or not en_data:
        print("❌ ファイルの読み込みに失敗しました")
        return
    
    # 2. キーの平坦化
    ja_keys = set(flatten_dict(ja_data).keys())
    en_keys = set(flatten_dict(en_data).keys())
    
    print(f"📊 統計情報:")
    print(f"  - 日本語キー数: {len(ja_keys)}")
    print(f"  - 英語キー数: {len(en_keys)}")
    print()
    
    # 3. キーの一致確認
    print("🔍 キーの一致確認:")
    
    ja_only = ja_keys - en_keys
    en_only = en_keys - ja_keys
    
    if not ja_only and not en_only:
        print("✅ 日本語版と英語版のキーは完全に一致しています")
    else:
        if ja_only:
            print(f"❌ 日本語版のみに存在するキー ({len(ja_only)}個):")
            for key in sorted(ja_only):
                print(f"  - {key}")
            print()
        
        if en_only:
            print(f"❌ 英語版のみに存在するキー ({len(en_only)}個):")
            for key in sorted(en_only):
                print(f"  - {key}")
            print()
    
    # 4. 未使用キーの検索
    print("🔍 未使用キーの検索中...")
    all_keys = ja_keys | en_keys
    unused_keys = []
    used_keys = []
    
    for i, key in enumerate(sorted(all_keys), 1):
        if i % 10 == 0:
            print(f"  進捗: {i}/{len(all_keys)}")
        
        usage_files = search_usage_in_files(key, search_dirs)
        if usage_files:
            used_keys.append((key, usage_files))
        else:
            unused_keys.append(key)
    
    print()
    print("📊 使用状況の結果:")
    print(f"  - 使用中のキー: {len(used_keys)}")
    print(f"  - 未使用のキー: {len(unused_keys)}")
    print()
    
    if unused_keys:
        print("❌ 未使用キー一覧:")
        for key in unused_keys:
            print(f"  - {key}")
        print()
    else:
        print("✅ すべてのキーが使用されています")
    
    # 5. 特定のキーの使用場所詳細
    if used_keys:
        print("📍 使用中キーの詳細 (最初の10個):")
        for key, files in used_keys[:10]:
            print(f"  {key}:")
            for file_path in files[:3]:  # 最初の3ファイルまで表示
                rel_path = os.path.relpath(file_path, r"c:\Git\solo-speak")
                print(f"    - {rel_path}")
            if len(files) > 3:
                print(f"    ... 他 {len(files) - 3} ファイル")
            print()

if __name__ == "__main__":
    main()
