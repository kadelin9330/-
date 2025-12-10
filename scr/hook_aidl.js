// ================================================
// 望远镜APP AIDL接口完整Hook脚本
// Hook目标：IScopeAidlInterface, IRequestCallback, ISeestarListener
// ================================================

Java.perform(function() {
    send("✅ Frida脚本开始注入...");
    
    // ================================================
    // 1. IScopeAidlInterface - 主控制接口Hook
    // ================================================
    try {
        var IScopeAidlInterface = Java.use('com.zwo.seestar.IScopeAidlInterface');
        
        // Hook sendRequest - 最重要的方法！
        var IScopeAidlInterface_Proxy = Java.use('com.zwo.seestar.IScopeAidlInterface$Stub$Proxy');
        if (IScopeAidlInterface_Proxy) {
            IScopeAidlInterface_Proxy.sendRequest.implementation = function(request, needObj, callback) {
                send("\n🔵 ===== IScopeAidlInterface.sendRequest 被调用 =====");
                send("  |- 请求JSON: " + request);
                send("  |- needObj: " + needObj);
                send("  |- callback对象: " + callback);
                
                // 检查是否包含WiFi扫描相关关键词
                if (request && request.indexOf("pi_station_scan") !== -1) {
                    send("  🎯 **发现WiFi扫描请求！**");
                }
                if (request && request.indexOf("station") !== -1) {
                    send("  📡 包含'station'关键词，可能与网络相关");
                }
                
                // 打印调用栈（精简版，只显示应用层）
                send("  |- 调用栈:");
                var stackTrace = Java.use("android.util.Log").getStackTraceString(
                    Java.use("java.lang.Exception").$new()
                );
                stackTrace.split('\n').forEach(function(line, index) {
                    if (index > 0 && index < 8 && line.indexOf("com.zwo.seestar") !== -1) {
                        send("      " + line.trim());
                    }
                });
                
                // 调用原方法
                return this.sendRequest(request, needObj, callback);
            };
            send("✅ Hook IScopeAidlInterface.sendRequest 成功");
        }
        
        // Hook sendCmd
        if (IScopeAidlInterface_Proxy.sendCmd) {
            IScopeAidlInterface_Proxy.sendCmd.implementation = function(cmdType, param) {
                send("\n🔵 ===== IScopeAidlInterface.sendCmd 被调用 =====");
                send("  |- cmdType: " + cmdType);
                send("  |- param: " + param);
                return this.sendCmd(cmdType, param);
            };
            send("✅ Hook IScopeAidlInterface.sendCmd 成功");
        }
        
        // Hook lockConnectIp 和 unlockConnectIp（网络连接相关）
        if (IScopeAidlInterface_Proxy.lockConnectIp) {
            IScopeAidlInterface_Proxy.lockConnectIp.implementation = function(ip, type) {
                send("\n🔵 ===== IScopeAidlInterface.lockConnectIp 被调用 =====");
                send("  |- IP地址: " + ip);
                send("  |- 类型: " + type);
                return this.lockConnectIp(ip, type);
            };
        }
        
        if (IScopeAidlInterface_Proxy.unlockConnectIp) {
            IScopeAidlInterface_Proxy.unlockConnectIp.implementation = function() {
                send("\n🔵 ===== IScopeAidlInterface.unlockConnectIp 被调用 =====");
                return this.unlockConnectIp();
            };
        }
        
        // Hook resetConnect（网络重置）
        if (IScopeAidlInterface_Proxy.resetConnect) {
            IScopeAidlInterface_Proxy.resetConnect.implementation = function() {
                send("\n🔵 ===== IScopeAidlInterface.resetConnect 被调用 =====");
                return this.resetConnect();
            };
        }
        
    } catch(e) {
        send("⚠️ Hook IScopeAidlInterface 失败: " + e.message);
    }
    
    // ================================================
    // 2. IRequestCallback - 请求结果回调Hook
    // ================================================
    try {
        var IRequestCallback = Java.use('com.zwo.seestar.IRequestCallback');
        
        IRequestCallback.onSuccess.implementation = function(resultJson) {
            send("\n🟢 ===== IRequestCallback.onSuccess 被调用 =====");
            send("  |- 结果JSON: " + resultJson);
            
            // 尝试解析JSON以便更易读
            if (resultJson) {
                try {
                    var jsonObj = JSON.parse(resultJson);
                    send("  |- 解析后的结果:");
                    send("     方法(method): " + (jsonObj.method || "无"));
                    send("     状态码(keyCode): " + (jsonObj.keyCode || "无"));
                    if (jsonObj.result) {
                        send("     结果数据(result): " + JSON.stringify(jsonObj.result, null, 2).substring(0, 200) + "...");
                    }
                } catch(e) {
                    send("  |- JSON解析失败: " + e);
                }
            }
            
            // 打印调用栈，看是谁调用了这个回调
            send("  |- 回调触发栈:");
            var stackTrace = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Exception").$new()
            );
            stackTrace.split('\n').forEach(function(line, index) {
                if (index > 0 && index < 6) {
                    send("      " + line.trim());
                }
            });
            
            // 调用原方法
            return this.onSuccess(resultJson);
        };
        send("✅ Hook IRequestCallback.onSuccess 成功");
        
    } catch(e) {
        send("⚠️ Hook IRequestCallback 失败: " + e.message);
    }
    
    // ================================================
    // 3. ISeestarListener - 事件监听器Hook
    // ================================================
    try {
        var ISeestarListener = Java.use('com.zwo.seestar.ISeestarListener');
        
        // Hook onEvent
        ISeestarListener.onEvent.implementation = function(event) {
            send("\n🟡 ===== ISeestarListener.onEvent 被调用 =====");
            send("  |- 事件: " + event);
            
            // 过滤感兴趣的事件
            if (event && (
                event.indexOf("station") !== -1 || 
                event.indexOf("wifi") !== -1 ||
                event.indexOf("network") !== -1 ||
                event.indexOf("scan") !== -1
            )) {
                send("  🎯 **发现网络/WiFi相关事件！**");
            }
            
            return this.onEvent(event);
        };
        
        // Hook onDataInfoChange
        ISeestarListener.onDataInfoChange.implementation = function(type, data) {
            send("\n🟡 ===== ISeestarListener.onDataInfoChange 被调用 =====");
            send("  |- 数据类型: " + type);
            send("  |- 数据内容: " + data);
            
            // 尝试解析数据
            if (data) {
                try {
                    var dataObj = JSON.parse(data);
                    send("  |- 解析后的数据: " + JSON.stringify(dataObj, null, 2).substring(0, 150) + "...");
                } catch(e) {}
            }
            
            return this.onDataInfoChange(type, data);
        };
        
        // Hook propertyChange
        ISeestarListener.propertyChange.implementation = function(prop, value) {
            send("\n🟡 ===== ISeestarListener.propertyChange 被调用 =====");
            send("  |- 属性: " + prop);
            send("  |- 值: " + value);
            return this.propertyChange(prop, value);
        };
        
        send("✅ Hook ISeestarListener 成功");
        
    } catch(e) {
        send("⚠️ Hook ISeestarListener 失败: " + e.message);
    }
    
    // ================================================
    // 4. 增强Hook：查找并Hook具体的实现类
    // ================================================
    try {
        // 查找所有实现了IScopeAidlInterface的类
        Java.choose('com.zwo.seestar.IScopeAidlInterface$Stub', {
            onMatch: function(instance) {
                send("\n🔍 找到IScopeAidlInterface实现类: " + instance.getClass().getName());
            },
            onComplete: function() {
                send("🔍 IScopeAidlInterface类搜索完成");
            }
        });
    } catch(e) {}
    
    // ================================================
    // 5. 通用Hook：捕获所有TCommand子类的exec方法
    // ================================================
    try {
        var TCommand = Java.use('com.zwo.seestar.socket.base.TCommand');
        
        TCommand.exec.implementation = function(io) {
            send("\n🔴 ===== TCommand.exec 被调用 =====");
            send("  |- 命令类: " + this.getClass().getName());
            send("  |- IO对象: " + io);
            
            // 如果是GetStationScanCmd，特别标记
            if (this.getClass().getName().indexOf("GetStationScanCmd") !== -1) {
                send("  🎯 **发现GetStationScanCmd执行！**");
                
                // 尝试调用encodeCommand查看发送内容
                try {
                    var encodedCmd = this.encodeCommand();
                    send("  |- 编码后的命令: " + encodedCmd);
                } catch(e) {}
            }
            
            // 打印调用栈
            send("  |- 调用栈:");
            var stackTrace = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Exception").$new()
            );
            stackTrace.split('\n').forEach(function(line, index) {
                if (index > 0 && index < 10 && line.indexOf("com.zwo.seestar") !== -1) {
                    send("      " + line.trim());
                }
            });
            
            return this.exec(io);
        };
        send("✅ Hook TCommand.exec 成功");
        
    } catch(e) {
        send("⚠️ Hook TCommand 失败: " + e.message);
    }
    
    send("\n🎯 ===== 所有Hook设置完成 =====");
    send("现在请在APP中执行操作（如扫描WiFi、连接设备等）以触发Hook");
    send("=====================================\n");
});