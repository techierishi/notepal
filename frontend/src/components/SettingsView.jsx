import { createSignal, onMount } from "solid-js";
import {
  GetSettings,
  SaveSettings,
  ChooseDir
} from "../../bindings/rilaunch/app";
import "./SettingsView.css";

function SettingsView(props) {
  const [settings, setSettings] = createSignal({
    notesDir: "",
    searchDirs: []
  });

  onMount(async () => {
    const settings = await GetSettings();
    setSettings(settings);
  });

  const handleNoteBrowse = async () => {
    const newDir = await ChooseDir();
    setSettings({ ...settings(), notesDir: newDir });
    SaveSettings({
      ...settings(),
      searchDirs: [...settings().searchDirs, newDir]
    });
  };

  const handleSearchBrowse = async () => {
    const newDir = await ChooseDir();
    setSettings({
      ...settings(),
      searchDirs: [...settings().searchDirs, newDir]
    });

    SaveSettings({
      ...settings(),
      searchDirs: [...settings().searchDirs, newDir]
    });
  };

  return (
    <div class="settings-overlay">
      <div class="settings-panel">
        {/* Header */}
        <div class="settings-header">
          <span class="settings-title">Settings</span>
          <button class="settings-close" onClick={props.onClose} title="Close">
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <line x1="1" y1="1" x2="10" y2="10" />
              <line x1="10" y1="1" x2="1" y2="10" />
            </svg>
          </button>
        </div>

        {/* Notes dir setting */}
        <div class="settings-section">
          <div class="settings-label">Notes folder</div>
          <div class="settings-row">
            <span class="settings-path">{settings().notesDir}</span>
            <button class="settings-browse-btn" onClick={handleNoteBrowse}>
              Browse…
            </button>
          </div>
          <div class="settings-hint">
            Markdown files are saved here, one per note.
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">Search folders</div>
          <div class="settings-row">
            <span class="settings-path">
              {settings().searchDirs.join(", ")}
            </span>
            <button class="settings-browse-btn" onClick={handleSearchBrowse}>
              Browse…
            </button>
          </div>
          <div class="settings-hint">
            Folders to search for files. Multiple folders can be added.
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
