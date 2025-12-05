#pragma once

#ifdef CRYPTODLL_EXPORTS
#define CRYPTODLL_API __declspec(dllexport)
#else
#define CRYPTODLL_API __declspec(dllimport)
#endif

#include <windows.h>
#include <vector>

// 加密函数
extern "C" CRYPTODLL_API void EncryptSections(BYTE* data, const std::vector<IMAGE_SECTION_HEADER>& sections, DWORD oep, bool is64Bit);

// 获取解密存根函数
extern "C" CRYPTODLL_API void* GetDecryptStub(bool is64Bit, DWORD* stubSize);
#pragma once
