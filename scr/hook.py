import frida
import sys
import time

def on_message(message, data, process_tag):
    if message['type'] == 'send':
        print(f"[{process_tag}] {message['payload']}")
    else:
        print(f"[{process_tag}] {message}")

def main():
    try:
        # 1. 获取USB设备
        device = frida.get_usb_device()
        print("[*] 设备已连接")
        
        # 2. 使用 spawn 启动应用（进程将被挂起）
        app_package = "com.zwo.seestar"
        pid = device.spawn([app_package])
        print(f"[*] 已生成应用进程，PID: {pid}")
        
        # 3. 附加到刚生成的（主）进程
        session = device.attach(pid)
        
        # 4. 为生成的主进程加载Hook脚本
        with open("hook_cert.js", "r", encoding="utf-8") as f:
            main_js_code = f.read()
        
        main_script = session.create_script(main_js_code)
        main_script.on('message', lambda msg, data: on_message(msg, data, "MAIN"))
        main_script.load()
        print("[✓] 主进程Hook脚本加载完毕")
        
        # 5. 恢复应用执行（此时应用真正开始运行，子进程也会被创建）
        device.resume(pid)
        print("[*] 应用进程已恢复执行")
        time.sleep(1)  # 稍等，给予子进程启动的时间
        
        # 6. 尝试附加到子进程
        print("[*] 尝试附加到子进程 :device ...")
        try:
            # 注意：子进程名需要包含 :device
            device_session = device.attach("com.zwo.seestar:device")
            with open("hook_cert.js", "r", encoding="utf-8") as f:
                device_js_code = f.read()
            
            device_script = device_session.create_script(device_js_code)
            device_script.on('message', lambda msg, data: on_message(msg, data, "DEVICE"))
            device_script.load()
            print("[✓] 子进程Hook脚本加载完毕")
        except Exception as e:
            print(f"[-] 附加子进程失败，可能尚未启动或名称不对: {e}")
            print("[*] 可以尝试增加等待时间，或检查子进程名")
        
        # 7. 保持脚本运行
        print("[*] 多进程Hook已就绪，等待事件...")
        sys.stdin.read()
        
    except Exception as e:
        print(f"[-] 发生错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()