import { For, Show } from 'solid-js';
import './StatusBar.css';

const TAB_HINTS = {
  clipboard: [
    { key: '↑↓',  label: 'Navigate' },
    { key: '↵',   label: 'Copy' },
    { key: 'Tab', label: 'Cycle' },
    { key: 'Esc', label: 'Quit' },
  ],
  notes: [
    { key: '+',   label: 'New' },
    { key: '⌘↵', label: 'Save' },
    { key: 'Esc', label: 'Back' },
    { key: 'Tab', label: 'Cycle' },
  ],
};

function StatusBar(props) {
  const hints = () => TAB_HINTS[props.activeTab] || [];

  return (
    <div class="status-bar">
      <div class="status-hints">
        <For each={hints()}>
          {(h) => <span class="status-hint">{h.key} {h.label}</span>}
        </For>
      </div>
      <Show when={props.statusMsg}>
        <span class={'status-message ' + (props.statusColor || 'info')}>
          {props.statusMsg}
        </span>
      </Show>
    </div>
  );
}

export default StatusBar;
