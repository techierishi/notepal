import {
  createSignal,
  createEffect,
  createMemo,
  onMount,
  onCleanup,
  Show
} from "solid-js";
import { Events } from "@wailsio/runtime";
import {
  GetClipData,
  GetNotes,
  ToggleClipSecret,
  ClearClipboard,
  SaveNote,
  DeleteNote,
  UpdateNote,
  WindowHide,
  WindowShow,
  SearchString,
  Quit
} from "../bindings/rilaunch/app";

import SearchBar from "./components/SearchBar";
import ClipboardView from "./components/ClipboardView";
import SearchView from "./components/SearchView";
import NotesView from "./components/NotesView";
import SettingsView from "./components/SettingsView";
import StatusBar from "./components/StatusBar";
import {
  IconClipboard,
  IconNotes,
  IconSettings,
  IconRefresh,
  IconTrash,
  IconFind
} from "./components/Icons";
import "./App.css";

const TABS = ["search", "clipboard", "notes"];

function App() {
  const [activeTab, setActiveTab] = createSignal("search");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [searchResults, setSearchResults] = createSignal([]);
  const [clipboardData, setClipboardData] = createSignal([]);
  const [clipboardSelectedIndex, setClipboardSelectedIndex] = createSignal(0);
  const [notesList, setNotesList] = createSignal([]);
  const [showSettings, setShowSettings] = createSignal(false);
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  const [statusMsg, setStatusMsg] = createSignal("");
  const [statusColor, setStatusColor] = createSignal("info");

  let statusTimer;
  let searchInputRef;
  let clipboardLoadId = 0;
  let notesLoadId = 0;
  let searchLoadId = 0;

  const showStatus = (msg, type = "info") => {
    clearTimeout(statusTimer);
    setStatusMsg(msg);
    setStatusColor(type);
    statusTimer = setTimeout(() => setStatusMsg(""), 2500);
  };

  const searchData = async (term) => {
    const result = await SearchString(term);
    try {
      const data = JSON.parse(result || "[]");
      let stringified = data.map((item) => {
        let preparedString = "";
        preparedString += item.file ? `**${item.file}: ${item.line}** \n` : "";
        preparedString += item.content ? `${item.content} \n` : "";
        return `${preparedString} \n------------------------------------------\n`;
      });
      return stringified.join("\n");
    } catch (e) {
      return 'No results found...';
    }
  };

  const handleSearchItemClick = async (item) => {
    try {
      const text =
        typeof item === "string"
          ? item
          : item?.content || item?.text || item?.value || item?.label || "";

      if (text) {
        await navigator.clipboard.writeText(text);
      }
      WindowHide();
    } catch (e) {
      console.error("Failed to handle search item click:", e);
      showStatus("Failed to use search item", "error");
    }
  };

  const filteredClipboardData = createMemo(() => {
    const term = searchQuery().trim().toLowerCase();
    if (!term) return clipboardData();
    return clipboardData().filter((item) =>
      (item.content || item.text || "").toLowerCase().includes(term)
    );
  });

  const filteredNotes = createMemo(() => {
    const term = searchQuery().trim().toLowerCase();
    if (!term) return notesList();
    return notesList().filter((n) => {
      const content = (n.content || "").toLowerCase();
      const tag = (n.tag || "").toLowerCase();
      return content.includes(term) || tag.includes(term);
    });
  });

  const searchPlaceholder = () => {
    switch (activeTab()) {
      case "clipboard":
        return "Filter clipboard...";
      case "notes":
        return "Search notes...";
      default:
        return "Search...";
    }
  };

  const focusSearch = () => {
    setTimeout(() => searchInputRef?.focus?.(), 30);
  };

  const switchTab = (tab) => {
    const sameTab = activeTab() === tab;
    setShowSettings(false);
    setIsMenuOpen(false);

    if (!sameTab) {
      setActiveTab(tab);
      setSearchQuery("");
      setSelectedIndex(0);
      setClipboardSelectedIndex(0);
    }

    if (tab === "clipboard") queueMicrotask(() => void loadClipboardData());
    if (tab === "notes") queueMicrotask(() => void loadNotes());

    focusSearch();
  };

  const loadClipboardData = async () => {
    const requestId = ++clipboardLoadId;
    try {
      const raw = await GetClipData("");
      if (requestId !== clipboardLoadId) return;
      setClipboardData(JSON.parse(raw || "[]"));
    } catch (e) {
      console.error("Failed to load clipboard:", e);
      if (requestId === clipboardLoadId) setClipboardData([]);
    }
  };

  const loadNotes = async () => {
    const requestId = ++notesLoadId;
    try {
      const raw = await GetNotes();
      if (requestId !== notesLoadId) return;
      setNotesList(JSON.parse(raw || "[]"));
    } catch (e) {
      console.error("Failed to load notes:", e);
      if (requestId === notesLoadId) setNotesList([]);
    }
  };

  const handleClipboardItemClick = async (item) => {
    try {
      await navigator.clipboard.writeText(item.content || item.text || "");
      WindowHide();
    } catch (e) {
      console.error("Failed to copy clipboard item:", e);
      showStatus("Failed to copy item", "error");
    }
  };

  const handleToggleSecret = async (item) => {
    try {
      await ToggleClipSecret(item.hash);
      setClipboardData((prev) =>
        prev.map((x) =>
          x.hash === item.hash ? { ...x, is_secret: !x.is_secret } : x
        )
      );
    } catch (e) {
      console.error("Failed to toggle secret:", e);
      showStatus("Failed to update item", "error");
    }
  };

  const handleClearClipboard = async () => {
    if (!confirm("Are you sure you want to clear all clipboard items?")) return;
    try {
      await ClearClipboard();
      setClipboardData([]);
      setClipboardSelectedIndex(0);
      showStatus("Clipboard cleared", "success");
    } catch (e) {
      console.error(e);
      showStatus("Failed to clear clipboard", "error");
    }
  };

  const handleReloadNotes = async () => {
    await loadNotes();
    showStatus("Notes reloaded", "success");
  };

  const handleSaveNote = async (content, tag) => {
    try {
      await SaveNote(content, tag);
      await loadNotes();
      showStatus("Note saved", "success");
    } catch (e) {
      console.error(e);
      showStatus("Failed to save", "error");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await DeleteNote(id);
      await loadNotes();
      showStatus("Note deleted", "success");
    } catch (e) {
      console.error(e);
      showStatus("Failed to delete", "error");
    }
  };

  const handleUpdateNote = async (id, content, tag) => {
    try {
      await UpdateNote(id, content, tag);
      await loadNotes();
      showStatus("Note updated", "success");
    } catch (e) {
      console.error(e);
      showStatus("Failed to update", "error");
    }
  };

  const handleKeyDown = async (e) => {
    if (e.key === "Escape") {
      if (searchQuery() !== "") {
        setSearchQuery("");
        return;
      }
      Quit();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      const cur = TABS.indexOf(activeTab());
      const safeCur = cur >= 0 ? cur : 0;
      const next = e.shiftKey
        ? (safeCur - 1 + TABS.length) % TABS.length
        : (safeCur + 1) % TABS.length;
      switchTab(TABS[next]);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && ["1", "2", "3"].includes(e.key)) {
      e.preventDefault();
      switchTab(TABS[parseInt(e.key, 10) - 1]);
      return;
    }

    if (showSettings()) return;
    if (activeTab() === "notes") return;

    if (activeTab() === "search") {
      const data = searchResults();
      if (!data.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % data.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i === 0 ? data.length - 1 : i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = data[Math.min(selectedIndex(), data.length - 1)];
        if (item) await handleSearchItemClick(item);
      }
      return;
    }

    if (activeTab() === "clipboard") {
      const data = filteredClipboardData();
      if (!data.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setClipboardSelectedIndex((i) => (i + 1) % data.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setClipboardSelectedIndex((i) => (i === 0 ? data.length - 1 : i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = data[Math.min(clipboardSelectedIndex(), data.length - 1)];
        if (item) await handleClipboardItemClick(item);
      }
    }
  };

  createEffect(() => {
    searchQuery();
    setSelectedIndex(0);
    setClipboardSelectedIndex(0);
  });

  createEffect(() => {
    const data = filteredClipboardData();
    const idx = clipboardSelectedIndex();
    if (!data.length && idx !== 0) {
      setClipboardSelectedIndex(0);
      return;
    }
    if (data.length && idx > data.length - 1) {
      setClipboardSelectedIndex(data.length - 1);
    }
  });

  createEffect(() => {
    const data = searchResults();
    const idx = selectedIndex();
    if (!data.length && idx !== 0) {
      setSelectedIndex(0);
      return;
    }
    if (data.length && idx > data.length - 1) {
      setSelectedIndex(data.length - 1);
    }
  });

  createEffect(() => {
    const term = searchQuery().trim();
    const tab = activeTab();
    const settingsOpen = showSettings();
    const requestId = ++searchLoadId;

    if (settingsOpen || tab !== "search") {
      setSearchResults('No results found...');
      return;
    }

    if (!term) {
      setSearchResults('No results found...');
      return;
    }

    const run = async () => {
      try {
        const results = await searchData(term);
        if (requestId !== searchLoadId) return;
        setSearchResults(results);
      } catch (e) {
        console.error("Search failed:", e);
        if (requestId === searchLoadId) setSearchResults('No results found...');
      }
    };

    void run();
  });

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    void loadClipboardData();

    // const offHotkey = Events.On("Backend:GlobalHotkeyEvent", () =>
    //   WindowShow()
    // );
    const offClipboard = Events.On("ClipboardUpdated", () => {
      if (activeTab() === "clipboard") void loadClipboardData();
    });
    const onLauncherShow = () => {
      requestAnimationFrame(() => {
        document.body.classList.add("visible");
        searchInputRef?.focus?.();
      });
    };

    window.addEventListener("launcher:show", onLauncherShow);
    searchInputRef?.focus?.();

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("launcher:show", onLauncherShow);
      clearTimeout(statusTimer);
      offHotkey?.();
      offClipboard?.();
    });
  });

  return (
    <div class="app" onClick={() => setIsMenuOpen(false)}>
      <div class="main-container">
        <div class="search-section">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder={searchPlaceholder()}
            onMenuClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((o) => !o);
            }}
          />

          <Show when={isMenuOpen() && !showSettings()}>
            <div
              class="plugin-menu-panel floating-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <span class="plugin-menu-title">
                {activeTab() === "search" && "Search"}
                {activeTab() === "clipboard" && "Clipboard"}
                {activeTab() === "notes" && "Notes"}
              </span>

              <div class="menu-list">
                <Show when={activeTab() === "clipboard"}>
                  <button
                    class="menu-item danger"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void handleClearClipboard();
                    }}
                  >
                    <IconTrash />
                    <span>Clear All</span>
                  </button>
                </Show>

                <Show when={activeTab() === "notes"}>
                  <button
                    class="menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void handleReloadNotes();
                    }}
                  >
                    <IconRefresh />
                    <span>Reload Notes</span>
                  </button>
                </Show>
              </div>
            </div>
          </Show>
        </div>

        <div class="body-section">
          <div class="sidebar">
            <button
              class={
                "tab-btn" +
                (activeTab() === "search" && !showSettings() ? " active" : "")
              }
              onClick={() => switchTab("search")}
              title="Search Ctrl+1"
            >
              <IconFind />
            </button>

            <button
              class={
                "tab-btn" +
                (activeTab() === "clipboard" && !showSettings()
                  ? " active"
                  : "")
              }
              onClick={() => switchTab("clipboard")}
              title="Clipboard Ctrl+2"
            >
              <IconClipboard />
            </button>

            <button
              class={
                "tab-btn" +
                (activeTab() === "notes" && !showSettings() ? " active" : "")
              }
              onClick={() => switchTab("notes")}
              title="Notes Ctrl+3"
            >
              <IconNotes />
            </button>

            <div class="sidebar-spacer" />

            <button
              class={"tab-btn settings-btn" + (showSettings() ? " active" : "")}
              onClick={() => {
                setIsMenuOpen(false);
                setShowSettings((s) => !s);
                focusSearch();
              }}
              title="Settings"
            >
              <IconSettings />
            </button>
          </div>

          <div class="content-panel">
            <Show when={showSettings()}>
              <SettingsView onClose={() => setShowSettings(false)} />
            </Show>

            <Show when={!showSettings() && activeTab() === "search"}>
              <SearchView
                searchData={searchQuery()}
                filteredSearchData={searchResults()}
                searchSelectedIndex={selectedIndex()}
                onItemClick={handleSearchItemClick}
              />
            </Show>

            <Show when={!showSettings() && activeTab() === "clipboard"}>
              <ClipboardView
                clipboardData={clipboardData()}
                filteredClipboardData={filteredClipboardData()}
                clipboardSelectedIndex={clipboardSelectedIndex()}
                onItemClick={handleClipboardItemClick}
                onToggleSecret={handleToggleSecret}
              />
            </Show>

            <Show when={!showSettings() && activeTab() === "notes"}>
              <NotesView
                notes={filteredNotes()}
                onSave={handleSaveNote}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
                onReload={loadNotes}
              />
            </Show>
          </div>
        </div>

        <StatusBar
          activeTab={showSettings() ? "settings" : activeTab()}
          statusMsg={statusMsg()}
          statusColor={statusColor()}
        />
      </div>
    </div>
  );
}

export default App;
