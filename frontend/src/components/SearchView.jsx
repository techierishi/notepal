import { For, Show } from 'solid-js';
import './SearchView.css';

// --- SVGs for Eye and Eye-Slash Icons ---
const IconEye = () => (
  <svg class="eye-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeSlash = () => (
  <svg class="eye-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function SearchView(props) {
  return (
    <div class="search-view">
      <div class="search-list">
        <For each={props.filteredSearchData}>
          {(item, index) => (
            <div
              class={`search-item${index() === props.searchSelectedIndex ? ' selected' : ''}`}
              onClick={() => props.onItemClick(item)}
            >
              <div class={`search-text${item.is_secret ? ' masked' : ''}`}>
                {item.content || item.text || 'No content'}
              </div>
              <div class="search-meta">
                <span class="search-type">{item.type || 'text'}</span>
                <div class="search-meta-right">

                  <span class="search-id">
                    {item.id ? item.id : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={props.filteredSearchData?.length === 0}>
          <div class="search-empty">
            {props.searchData.length > 0 ? 'No matching items' : 'Search is empty'}
          </div>
        </Show>
      </div>
    </div>
  );
}

export default SearchView;


