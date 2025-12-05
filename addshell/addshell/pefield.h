#include <windows.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <algorithm>

// 用于存储PE文件信息的结构
struct PEFile {
    std::vector<BYTE> data;
    PIMAGE_DOS_HEADER dosHeader;
    PIMAGE_NT_HEADERS32 ntHeaders32;
    PIMAGE_NT_HEADERS64 ntHeaders64;
    bool is64Bit;
    std::vector<PIMAGE_SECTION_HEADER> sections;
};

bool ReadPEFile(const std::string& filePath, PEFile& peFile);
bool AddShellSection(PEFile& peFile, DWORD shellCodeSize);
void ProcessRelocations(PEFile& peFile);
bool SavePEFile(const std::string& filePath, PEFile& peFile);
