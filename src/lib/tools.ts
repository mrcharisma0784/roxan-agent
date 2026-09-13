import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  BookOpenCheck,
  Brain,
  Camera,
  CircleMinus,
  CirclePlus,
  Code2,
  Compass,
  FilePen,
  FilePlus2,
  FileSymlink,
  FileText,
  FileX2,
  FolderInput,
  FolderPlus,
  FolderX,
  Globe,
  Image,
  Keyboard,
  ListTree,
  MessageCircleQuestion,
  MousePointer2,
  MousePointerClick,
  PackageMinus,
  PackagePlus,
  PenLine,
  Plug,
  Rocket,
  FolderArchive,
  Route,
  ScanSearch,
  Search,
  SquareTerminal,
} from "lucide-react";

export type ToolDef = {
  id: string;
  icon: LucideIcon;
  active: string;
  done: string;
};

export type ToolCategory = {
  num: string;
  label: string;
  tools: ToolDef[];
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    num: "01",
    label: "Dosya ve Dizin İşlemleri",
    tools: [
      { id: "file_read", icon: FileText, active: "File Reading", done: "File Read" },
      { id: "file_create", icon: FilePlus2, active: "File Creating", done: "File Created" },
      { id: "file_edit", icon: FilePen, active: "File Editing", done: "File Edited" },
      { id: "file_delete", icon: FileX2, active: "File Deleting", done: "File Deleted" },
      { id: "file_move", icon: FileSymlink, active: "File Moving", done: "File Moved" },
      { id: "dir_list", icon: ListTree, active: "Directory Listing", done: "Directory Listed" },
      { id: "dir_create", icon: FolderPlus, active: "Directory Creating", done: "Directory Created" },
      { id: "dir_delete", icon: FolderX, active: "Directory Deleting", done: "Directory Deleted" },
      { id: "dir_move", icon: FolderInput, active: "Directory Moving", done: "Directory Moved" },
    ],
  },
  {
    num: "02",
    label: "Keşif ve Arama",
    tools: [
      { id: "explore", icon: Search, active: "Exploring", done: "Explored" },
      { id: "web_search", icon: Globe, active: "Web Searching", done: "Web Searched" },
      {
        id: "workspace_instructions_read",
        icon: BookOpenCheck,
        active: "Workspace Instructions Reading",
        done: "Workspace Instructions Read",
      },
    ],
  },
  {
    num: "03",
    label: "Çalıştırma",
    tools: [
      { id: "command_exec", icon: SquareTerminal, active: "Command Executing", done: "Command Executed" },
    ],
  },
  {
    num: "04",
    label: "Görsel Doğrulama",
    tools: [{ id: "image_view", icon: Image, active: "Image Viewing", done: "Image Viewed" }],
  },
  {
    num: "05",
    label: "Arşivleme",
    tools: [
      { id: "zip_create", icon: FolderArchive, active: "ZIP Creating", done: "ZIP Created" },
      { id: "zip_extract", icon: FolderArchive, active: "ZIP Extracting", done: "ZIP Extracted" },
      { id: "project_archive", icon: FolderArchive, active: "Project Archiving", done: "Project Archived" },
    ],
  },
  {
    num: "06",
    label: "Tarayıcı ve Web Kullanımı",
    tools: [
      { id: "page_navigate", icon: Compass, active: "Page Navigating", done: "Page Navigated" },
      { id: "element_click", icon: MousePointerClick, active: "Element Clicking", done: "Element Clicked" },
      { id: "form_type", icon: Keyboard, active: "Form Typing", done: "Form Typed" },
      { id: "element_hover", icon: MousePointer2, active: "Element Hovering", done: "Element Hovered" },
      { id: "page_scroll", icon: ArrowDownUp, active: "Page Scrolling", done: "Page Scrolled" },
      { id: "dom_inspect", icon: Code2, active: "DOM Inspecting", done: "DOM Inspected" },
      { id: "screenshot", icon: Camera, active: "Screenshot Capturing", done: "Screenshot Captured" },
    ],
  },
  {
    num: "07",
    label: "Biliş ve İletişim",
    tools: [
      { id: "reasoning", icon: Brain, active: "Reasoning", done: "Reasoned" },
      { id: "planning", icon: Route, active: "Planning", done: "Planned" },
      { id: "ask", icon: MessageCircleQuestion, active: "Soru hazırlanıyor", done: "Soru hazır" },
    ],
  },
  {
    num: "08",
    label: "Beceri Yönetimi",
    tools: [
      { id: "skills_load", icon: PackagePlus, active: "Skills Loading", done: "Skills Loaded" },
      { id: "skills_unload", icon: PackageMinus, active: "Skills Unloading", done: "Skills Unloaded" },
    ],
  },
  {
    num: "09",
    label: "Hafıza Yönetimi",
    tools: [
      { id: "memory_add", icon: CirclePlus, active: "Memory Adding", done: "Memory Added" },
      { id: "memory_recall", icon: ScanSearch, active: "Memory Recalling", done: "Memory Recalled" },
      { id: "memory_edit", icon: PenLine, active: "Memory Editing", done: "Memory Edited" },
      { id: "memory_remove", icon: CircleMinus, active: "Memory Removing", done: "Memory Removed" },
    ],
  },
  {
    num: "10",
    label: "Entegrasyon ve API",
    tools: [
      { id: "api_request", icon: Plug, active: "API Requesting", done: "API Requested" },
      { id: "deploy", icon: Rocket, active: "Deploying", done: "Deployed" },
    ],
  },
];

export const ALL_TOOLS = TOOL_CATEGORIES.flatMap((category) => category.tools);

export function findTool(id: string) {
  return ALL_TOOLS.find((tool) => tool.id === id);
}
