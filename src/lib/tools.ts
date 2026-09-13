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
  Database,
  Eye,
  FileOutput,
  FlaskConical,
  CalendarClock,
  Users,
  Workflow,
  Wrench,
  Store,
  Layers3,
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
      { id: "browser_back", icon: ArrowDownUp, active: "Going Back", done: "Went Back" },
      { id: "browser_forward", icon: ArrowDownUp, active: "Going Forward", done: "Went Forward" },
      { id: "browser_reload", icon: Route, active: "Reloading Page", done: "Page Reloaded" },
      { id: "browser_tab_open", icon: Globe, active: "Opening Tab", done: "Tab Opened" },
      { id: "browser_tab_close", icon: Globe, active: "Closing Tab", done: "Tab Closed" },
      { id: "browser_tab_switch", icon: Globe, active: "Switching Tab", done: "Tab Switched" },
      { id: "browser_tabs", icon: Globe, active: "Listing Tabs", done: "Tabs Listed" },
      { id: "browser_vision", icon: Eye, active: "Vision Analyzing", done: "Vision Analyzed" },
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
      { id: "workspace_memory_recall", icon: Database, active: "Workspace Memory Reading", done: "Workspace Memory Read" },
      { id: "workspace_memory_save", icon: Database, active: "Workspace Memory Saving", done: "Workspace Memory Saved" },
      { id: "workspace_memory_list", icon: Database, active: "Workspace Memory Listing", done: "Workspace Memory Listed" },
      { id: "workspace_checkpoint_create", icon: Database, active: "Checkpoint Creating", done: "Checkpoint Created" },
      { id: "workspace_checkpoint_list", icon: Database, active: "Checkpoint Listing", done: "Checkpoints Listed" },
      { id: "workspace_checkpoint_restore", icon: Database, active: "Checkpoint Restoring", done: "Checkpoint Restored" },
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
  {
    num: "11",
    label: "P2: Araştırma, Artifact ve Otomasyon",
    tools: [
      { id: "deep_research", icon: FlaskConical, active: "Deep Researching", done: "Deep Research Completed" },
      { id: "artifact_create", icon: FileOutput, active: "Creating Artifact", done: "Artifact Created" },
      { id: "artifact_list", icon: FileOutput, active: "Listing Artifacts", done: "Artifacts Listed" },
      { id: "agent_task_create", icon: CalendarClock, active: "Scheduling Agent", done: "Agent Scheduled" },
      { id: "agent_task_list", icon: CalendarClock, active: "Listing Agent Tasks", done: "Agent Tasks Listed" },
      { id: "agent_task_delete", icon: CalendarClock, active: "Deleting Agent Task", done: "Agent Task Deleted" },
      { id: "agent_delegate", icon: Workflow, active: "Delegating Agents", done: "Agents Delegated" },
      { id: "agent_job_create", icon: Workflow, active: "Creating Long Job", done: "Long Job Created" },
      { id: "agent_job_list", icon: Workflow, active: "Listing Long Jobs", done: "Long Jobs Listed" },
      { id: "agent_job_cancel", icon: Workflow, active: "Cancelling Long Job", done: "Long Job Cancelled" },
      { id: "maintenance_plan_create", icon: Wrench, active: "Creating Maintenance Plan", done: "Maintenance Plan Created" },
      { id: "maintenance_plan_list", icon: Wrench, active: "Listing Maintenance Plans", done: "Maintenance Plans Listed" },
      { id: "maintenance_plan_delete", icon: Wrench, active: "Deleting Maintenance Plan", done: "Maintenance Plan Deleted" },
    ],
  },
  {
    num: "12",
    label: "P3: Agent Ecosystem",
    tools: [
      { id: "skill_catalog", icon: Store, active: "Loading Skill Catalog", done: "Skill Catalog Loaded" },
      { id: "skill_install", icon: Layers3, active: "Installing Skill", done: "Skill Installed" },
      { id: "skill_uninstall", icon: Layers3, active: "Removing Skill", done: "Skill Removed" },
      { id: "workspace_members", icon: Users, active: "Loading Workspace Members", done: "Workspace Members Loaded" },
      { id: "workspace_member_add", icon: Users, active: "Adding Workspace Member", done: "Workspace Member Added" },
      { id: "workspace_member_remove", icon: Users, active: "Removing Workspace Member", done: "Workspace Member Removed" },
    ],
  },
];


export const ALL_TOOLS = TOOL_CATEGORIES.flatMap((category) => category.tools);

export function findTool(id: string) {
  return ALL_TOOLS.find((tool) => tool.id === id);
}
