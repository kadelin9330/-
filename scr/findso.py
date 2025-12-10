#!/usr/bin/env python3
"""
在.so二进制文件中搜索特定字符串的Python脚本
适用于Windows/Linux/macOS
"""

import os
import sys
import argparse
from pathlib import Path

def search_string_in_file(file_path, search_string, buffer_size=8192):
    """
    在二进制文件中搜索字符串
    
    Args:
        file_path: 文件路径
        search_string: 要搜索的字符串
        buffer_size: 读取缓冲区大小
        
    Returns:
        bool: 是否找到匹配
    """
    try:
        # 将搜索字符串编码为字节
        search_bytes = search_string.encode('utf-8')
        
        with open(file_path, 'rb') as f:
            # 使用滑动窗口方式读取，避免内存问题
            overlap = len(search_bytes) - 1
            prev_chunk = b''
            
            while True:
                chunk = f.read(buffer_size)
                if not chunk:
                    break
                    
                # 将前一个块的末尾部分与当前块连接，防止字符串被边界切割
                combined = prev_chunk + chunk
                if search_bytes in combined:
                    return True
                    
                # 保存当前块的末尾部分用于下一次检查
                prev_chunk = chunk[-overlap:] if len(chunk) >= overlap else chunk
                
        return False
        
    except Exception as e:
        print(f"  读取文件时出错 {file_path}: {e}")
        return False

def find_and_search_so_files(search_dir, search_string, verbose=True):
    """
    递归查找并搜索.so文件
    
    Args:
        search_dir: 要搜索的目录
        search_string: 要搜索的字符串
        verbose: 是否显示详细信息
        
    Returns:
        list: 包含匹配字符串的文件路径列表
    """
    search_dir = Path(search_dir)
    if not search_dir.exists():
        print(f"错误: 目录不存在 - {search_dir}")
        return []
    
    if not search_dir.is_dir():
        print(f"错误: 路径不是目录 - {search_dir}")
        return []
    
    matching_files = []
    so_count = 0
    
    print(f"开始在目录中搜索: {search_dir.absolute()}")
    print(f"搜索字符串: \"{search_string}\"")
    print("-" * 60)
    
    # 递归遍历目录
    for root, dirs, files in os.walk(search_dir):
        for file in files:
            if file.endswith('.so'):
                so_count += 1
                file_path = Path(root) / file
                
                if verbose:
                    print(f"检查 [{so_count}]: {file_path}")
                
                if search_string_in_file(file_path, search_string):
                    matching_files.append(str(file_path))
                    print(f"  ✓ 找到匹配!")
                elif verbose:
                    print(f"  ✗ 未找到匹配")
    
    print("-" * 60)
    print(f"搜索完成!")
    print(f"扫描了 {so_count} 个 .so 文件")
    print(f"找到 {len(matching_files)} 个包含目标字符串的文件")
    
    if matching_files:
        print("\n匹配的文件列表:")
        for i, file_path in enumerate(matching_files, 1):
            print(f"  {i}. {file_path}")
    
    return matching_files

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='在.so文件中搜索特定字符串',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  %(prog)s "D:\\apk\\lib" "com/zwo/seestar/socket/command/sta/GetStationScanCmd"
  %(prog)s ./lib --string "pi_station_scan" --quiet
        """
    )
    
    parser.add_argument(
        'directory',
        help='要搜索的目录路径'
    )
    
    parser.add_argument(
        '-s', '--string',
        default='CMD_STATION_SCAN',
        help='要搜索的字符串 (默认: CMD_STATION_SCAN)'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='安静模式，只显示结果'
    )
    
    parser.add_argument(
        '-o', '--output',
        help='将结果保存到文件'
    )
    
    args = parser.parse_args()
    
    # 执行搜索
    matching_files = find_and_search_so_files(
        args.directory, 
        args.string, 
        verbose=not args.quiet
    )
    
    # 如果需要，保存结果到文件
    if args.output and matching_files:
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(f"搜索目录: {args.directory}\n")
                f.write(f"搜索字符串: {args.string}\n")
                f.write(f"匹配文件数: {len(matching_files)}\n\n")
                for file_path in matching_files:
                    f.write(f"{file_path}\n")
            print(f"\n结果已保存到: {args.output}")
        except Exception as e:
            print(f"保存结果到文件时出错: {e}")
    
    return 0 if matching_files else 1

if __name__ == '__main__':
    sys.exit(main())