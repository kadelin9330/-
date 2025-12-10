// ssl_hook.js
// 用于Hook OpenSSL/libssl证书验证与固定相关函数的Frida脚本

var SSL_Hooks = (function() {
    var utils = {
        // 提取并打印X509证书信息
        printX509Info: function(cert, prefix) {
            if (cert.isNull()) {
                console.log(prefix + " Certificate: NULL");
                return;
            }

            try {
                // 使用OpenSSL原生函数（如果可用）获取文本信息
                var bio = NativeFunction.byName("BIO_new", "libcrypto.so")(NativeFunction.byName("BIO_s_mem", "libcrypto.so")());
                NativeFunction.byName("X509_print", "libcrypto.so")(bio, cert);
                
                var lenPtr = Memory.alloc(Process.pointerSize);
                var dataPtr = NativeFunction.byName("BIO_get_mem_data", "libcrypto.so")(bio, lenPtr);
                var len = lenPtr.readInt();
                
                if (len > 0) {
                    var certText = Memory.readUtf8String(dataPtr, len);
                    console.log(prefix + " Certificate Details:\n" + certText);
                }
                NativeFunction.byName("BIO_free", "libcrypto.so")(bio);
            } catch (e) {
                // 备用方案：提取关键字段
                try {
                    var subj = NativeFunction.byName("X509_get_subject_name", "libcrypto.so")(cert);
                    var issuer = NativeFunction.byName("X509_get_issuer_name", "libcrypto.so")(cert);
                    
                    console.log(prefix + " Certificate Subject/Issuer (fallback)");
                    // 可以进一步解析X509_NAME对象
                } catch (e2) {
                    console.log(prefix + " Certificate: (Failed to extract details)");
                }
            }
        },
        
        // 计算证书或公钥指纹 (SHA256)
        calculateFingerprint: function(cert) {
            // 这里需要实现具体的指纹计算逻辑
            // 可以通过X509_digest或EVP_PKEY_get_raw_public_key实现
            return "(Fingerprint calculation placeholder)";
        }
    };

    var hooks = {
        // Hook 1: SSL_CTX_set_verify - 设置验证回调
        hook_SSL_CTX_set_verify: function() {
            var addr = Module.findExportByName("libssl.so", "SSL_CTX_set_verify");
            if (!addr) {
                console.warn("[!] SSL_CTX_set_verify not found in libssl.so");
                // 尝试其他常见库名
                var libNames = ["libssl.so.1.1", "libssl.so.1.0.0", "libssl.so.3", "libopenssl.so"];
                for (var i = 0; i < libNames.length; i++) {
                    addr = Module.findExportByName(libNames[i], "SSL_CTX_set_verify");
                    if (addr) break;
                }
            }
            
            if (addr) {
                Interceptor.attach(addr, {
                    onEnter: function(args) {
                        // 函数签名: SSL_CTX_set_verify(SSL_CTX *ctx, int mode, int (*verify_callback)(int, X509_STORE_CTX *))
                        this.ctx = args[0];
                        this.mode = args[1].toInt32();
                        this.callback = args[2];
                        
                        console.log("\n=== SSL_CTX_set_verify Called ===");
                        console.log("Context: " + this.ctx);
                        console.log("Verify Mode: " + this.mode + 
                                  " (SSL_VERIFY_NONE=" + (this.mode === 0 ? "YES" : "NO") + 
                                  ", SSL_VERIFY_PEER=" + (this.mode & 1 ? "YES" : "NO") + ")");
                        console.log("Callback Function: " + this.callback);
                        
                        // 如果提供了自定义回调，可以进一步Hook它
                        if (!this.callback.isNull()) {
                            console.log("Custom verify callback detected at: " + this.callback);
                        }
                    }
                });
                console.log("[+] SSL_CTX_set_verify hook installed");
            } else {
                console.error("[-] Failed to find SSL_CTX_set_verify");
            }
        },

        // Hook 2: SSL_get_peer_certificate - 获取对等证书
        hook_SSL_get_peer_certificate: function() {
            var addr = Module.findExportByName("libssl.so", "SSL_get_peer_certificate");
            if (!addr) return;
            
            Interceptor.attach(addr, {
                onEnter: function(args) {
                    this.ssl = args[0];
                    console.log("\n=== SSL_get_peer_certificate Called ===");
                    console.log("SSL Connection: " + this.ssl);
                },
                onLeave: function(retval) {
                    console.log("Returned Certificate: " + retval);
                    if (!retval.isNull()) {
                        utils.printX509Info(retval, "Peer");
                    }
                }
            });
            console.log("[+] SSL_get_peer_certificate hook installed");
        },

        // Hook 3: SSL_get_peer_cert_chain - 获取证书链
        hook_SSL_get_peer_cert_chain: function() {
            var addr = Module.findExportByName("libssl.so", "SSL_get_peer_cert_chain");
            if (!addr) return;
            
            Interceptor.attach(addr, {
                onEnter: function(args) {
                    this.ssl = args[0];
                    console.log("\n=== SSL_get_peer_cert_chain Called ===");
                },
                onLeave: function(retval) {
                    console.log("Certificate Chain Address: " + retval);
                    // 注意: retval 是 STACK_OF(X509)*，需要进一步解析
                }
            });
            console.log("[+] SSL_get_peer_cert_chain hook installed");
        },

        // Hook 4: 自定义验证回调的通用Hook (如果找到)
        hook_generic_verify_callback: function() {
            // 这个函数需要在实际找到回调地址后动态安装
            console.log("[*] To hook specific verify callback, find its address first");
        },

        // Hook 5: 网络数据读写 (辅助查看SSL通信)
        hook_SSL_read_write: function() {
            // 参考已有实现[citation:7]
            var sslReadAddr = Module.findExportByName("libssl.so", "SSL_read");
            if (sslReadAddr) {
                Interceptor.attach(sslReadAddr, {
                    onEnter: function(args) {
                        this.buf = args[1];
                        this.len = args[2].toInt32();
                    },
                    onLeave: function(retval) {
                        var bytesRead = retval.toInt32();
                        if (bytesRead > 0) {
                            console.log("\n[SSL_read] Retrieved " + bytesRead + " bytes");
                            // 可以打印前N个字节: Memory.readByteArray(this.buf, Math.min(bytesRead, 64))
                        }
                    }
                });
                console.log("[+] SSL_read hook installed");
            }
            
            var sslWriteAddr = Module.findExportByName("libssl.so", "SSL_write");
            if (sslWriteAddr) {
                Interceptor.attach(sslWriteAddr, {
                    onEnter: function(args) {
                        this.buf = args[1];
                        this.len = args[2].toInt32();
                        console.log("\n[SSL_write] Writing " + this.len + " bytes");
                    }
                });
                console.log("[+] SSL_write hook installed");
            }
        }
    };

    return {
        installAll: function() {
            console.log("[*] Installing SSL/TLS Certificate Hooks...");
            
            hooks.hook_SSL_CTX_set_verify();
            hooks.hook_SSL_get_peer_certificate();
            hooks.hook_SSL_get_peer_cert_chain();
            hooks.hook_SSL_read_write();
            
            console.log("\n[*] All hooks installed. Monitoring SSL/TLS operations...");
            console.log("[*] Note: Certificate pinning logic通常实现在自定义验证回调中");
            console.log("[*]       Hook SSL_CTX_set_verify 后查找具体的回调地址进行深度Hook");
        },
        
        installSpecific: function(hookName) {
            if (hooks[hookName]) {
                hooks[hookName]();
            } else {
                console.error("Unknown hook: " + hookName);
            }
        }
    };
})();


// ==================== 脚本执行入口 ====================
Java.perform(function() {
    console.log("\n" +
        "╔══════════════════════════════════════════╗\n" +
        "║   libssl.so Certificate Hook Script      ║\n" +
        "║   Monitoring SSL Verification & Pinning  ║\n" +
        "╚══════════════════════════════════════════╝\n");
    
    // 延迟执行，确保native库已加载
    setTimeout(function() {
        SSL_Hooks.installAll();
    }, 1000);
});