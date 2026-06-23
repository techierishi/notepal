import { Show } from 'solid-js';
import './SearchBar.css';


function SearchBar(props) {
  return (
    <div class="search-bar">
      <Show
        when={false}
        fallback={
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <line x1="10.5" y1="10.5" x2="14" y2="14"/>
          </svg>
        }
      >
      </Show>

      <div class="search-input-wrap">
        <input
          ref={props.ref}
          type="text"
          class={"search-input" }
          placeholder={props.placeholder || 'Search...'}
          value={props.value}
          onInput={(e) =>{ 
            props.onInput(e?.target?.value); 
          }}
          autocomplete="off"
          spellcheck={false}
        />
      </div>

      <button class="search-menu-btn" onClick={props.onMenuClick} title="Menu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
    </div>
  );
}

export default SearchBar;
